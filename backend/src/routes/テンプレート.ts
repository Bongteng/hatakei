import { Hono } from "hono";
import { Pool } from "pg";
import type { 環境変数型 } from "../types.js";
import { 認証必須 } from "../middleware/認証.js";

export const テンプレートルーターを作る = (db: Pool) => {
  const ルーター = new Hono<環境変数型>();

  // 一覧・検索
  ルーター.get("/", async (c) => {
    const q = c.req.query("q") ?? "";
    const tag = c.req.query("tag") ?? "";
    const sort = c.req.query("sort") === "newest" ? "newest" : "likes";
    const ユーザーid = c.get("ユーザーid");

    // メインクエリ: テンプレート + いいね数 + 野菜情報
    const orderBy = sort === "newest"
      ? "t.作成日時 DESC"
      : "いいね数 DESC, t.作成日時 DESC";

    let where = "WHERE 1=1";
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (q) {
      where += ` AND (t.テンプレート名 ILIKE $${paramIndex} OR v.名称 ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (tag) {
      where += ` AND EXISTS (SELECT 1 FROM テンプレートタグ tt WHERE tt.テンプレートid = t.id AND tt.タグ = $${paramIndex})`;
      params.push(tag);
      paramIndex++;
    }

    const テンプレート結果 = await db.query(
      `SELECT
        t.id, t.テンプレート名, t.説明文, t.野菜id, t.作成者id, t.作成日時,
        v.名称 AS 野菜名称, v.色 AS 野菜色,
        COALESCE(likes.cnt, 0)::int AS いいね数
       FROM スケジュールテンプレート t
       JOIN 野菜 v ON v.id = t.野菜id
       LEFT JOIN (
         SELECT テンプレートid, COUNT(*) AS cnt FROM テンプレートいいね GROUP BY テンプレートid
       ) likes ON likes.テンプレートid = t.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT 50`,
      params
    );

    if (テンプレート結果.rows.length === 0) {
      return c.json([]);
    }

    const ids = テンプレート結果.rows.map((r: { id: string }) => r.id);

    // イベント取得
    const イベント結果 = await db.query(
      `SELECT テンプレートid, id, イベント名, 開始週, 終了週
       FROM テンプレートイベント
       WHERE テンプレートid = ANY($1)`,
      [ids]
    );

    // タグ取得
    const タグ結果 = await db.query(
      `SELECT テンプレートid, タグ
       FROM テンプレートタグ
       WHERE テンプレートid = ANY($1)`,
      [ids]
    );

    // いいね済みチェック
    let いいね済みSet = new Set<string>();
    if (ユーザーid) {
      const いいね結果 = await db.query(
        `SELECT テンプレートid FROM テンプレートいいね
         WHERE テンプレートid = ANY($1) AND ユーザーid = $2`,
        [ids, ユーザーid]
      );
      いいね済みSet = new Set(いいね結果.rows.map((r: { テンプレートid: string }) => r.テンプレートid));
    }

    // マージ
    type イベント行 = { テンプレートid: string; id: string; イベント名: string; 開始週: number; 終了週: number };
    type タグ行 = { テンプレートid: string; タグ: string };

    const イベントMap = new Map<string, イベント行[]>();
    for (const row of イベント結果.rows as イベント行[]) {
      const list = イベントMap.get(row.テンプレートid) ?? [];
      list.push(row);
      イベントMap.set(row.テンプレートid, list);
    }

    const タグMap = new Map<string, string[]>();
    for (const row of タグ結果.rows as タグ行[]) {
      const list = タグMap.get(row.テンプレートid) ?? [];
      list.push(row.タグ);
      タグMap.set(row.テンプレートid, list);
    }

    type テンプレート行 = {
      id: string; テンプレート名: string; 説明文: string; 野菜id: string;
      作成者id: string; 作成日時: string; 野菜名称: string; 野菜色: string; いいね数: number;
    };

    const 結果 = (テンプレート結果.rows as テンプレート行[]).map((t) => ({
      id: t.id,
      テンプレート名: t.テンプレート名,
      説明文: t.説明文,
      野菜id: t.野菜id,
      作成者id: t.作成者id,
      作成日時: t.作成日時,
      野菜名称: t.野菜名称,
      野菜色: t.野菜色,
      いいね数: t.いいね数,
      イベント一覧: (イベントMap.get(t.id) ?? []).map((e) => ({
        id: e.id,
        イベント名: e.イベント名,
        開始週: e.開始週,
        終了週: e.終了週,
      })),
      タグ一覧: タグMap.get(t.id) ?? [],
      いいね済み: いいね済みSet.has(t.id),
    }));

    return c.json(結果);
  });

  // 登録
  ルーター.post("/", 認証必須, async (c) => {
    const body = await c.req.json() as {
      テンプレート名: string;
      説明文: string;
      野菜id: string;
      イベント一覧: { イベント名: string; 開始週: number; 終了週: number }[];
      タグ一覧: string[];
    };
    const ユーザーid = c.get("ユーザーid")!;
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `INSERT INTO スケジュールテンプレート (テンプレート名, 説明文, 野菜id, 作成者id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [body.テンプレート名, body.説明文, body.野菜id, ユーザーid]
      );
      const テンプレートid = rows[0].id as string;

      for (const ev of body.イベント一覧) {
        await client.query(
          `INSERT INTO テンプレートイベント (テンプレートid, イベント名, 開始週, 終了週)
           VALUES ($1, $2, $3, $4)`,
          [テンプレートid, ev.イベント名, ev.開始週, ev.終了週]
        );
      }

      for (const タグ of body.タグ一覧) {
        await client.query(
          `INSERT INTO テンプレートタグ (テンプレートid, タグ) VALUES ($1, $2)`,
          [テンプレートid, タグ]
        );
      }

      await client.query("COMMIT");
      return c.json({ id: テンプレートid }, 201);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });

  // 更新
  ルーター.put("/:id", 認証必須, async (c) => {
    const テンプレートid = c.req.param("id");
    const ユーザーid = c.get("ユーザーid")!;

    const { rows } = await db.query(
      `SELECT 作成者id FROM スケジュールテンプレート WHERE id = $1`,
      [テンプレートid]
    );
    if (rows.length === 0) return c.json({ error: "見つかりません" }, 404);
    if (rows[0].作成者id !== ユーザーid) return c.json({ error: "権限がありません" }, 403);

    const body = await c.req.json() as {
      テンプレート名: string;
      説明文: string;
      イベント一覧: { イベント名: string; 開始週: number; 終了週: number }[];
      タグ一覧: string[];
    };

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE スケジュールテンプレート SET テンプレート名 = $1, 説明文 = $2 WHERE id = $3`,
        [body.テンプレート名, body.説明文, テンプレートid]
      );

      await client.query(`DELETE FROM テンプレートイベント WHERE テンプレートid = $1`, [テンプレートid]);
      for (const ev of body.イベント一覧) {
        await client.query(
          `INSERT INTO テンプレートイベント (テンプレートid, イベント名, 開始週, 終了週)
           VALUES ($1, $2, $3, $4)`,
          [テンプレートid, ev.イベント名, ev.開始週, ev.終了週]
        );
      }

      await client.query(`DELETE FROM テンプレートタグ WHERE テンプレートid = $1`, [テンプレートid]);
      for (const タグ of body.タグ一覧) {
        await client.query(
          `INSERT INTO テンプレートタグ (テンプレートid, タグ) VALUES ($1, $2)`,
          [テンプレートid, タグ]
        );
      }

      await client.query("COMMIT");
      return c.json({ ok: true });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });

  // 削除
  ルーター.delete("/:id", 認証必須, async (c) => {
    const テンプレートid = c.req.param("id");
    const ユーザーid = c.get("ユーザーid")!;

    const { rows } = await db.query(
      `SELECT 作成者id FROM スケジュールテンプレート WHERE id = $1`,
      [テンプレートid]
    );
    if (rows.length === 0) return c.json({ error: "見つかりません" }, 404);
    if (rows[0].作成者id !== ユーザーid) return c.json({ error: "権限がありません" }, 403);

    await db.query(`DELETE FROM スケジュールテンプレート WHERE id = $1`, [テンプレートid]);
    return c.json({ ok: true });
  });

  // いいね追加
  ルーター.post("/:id/likes", 認証必須, async (c) => {
    const テンプレートid = c.req.param("id");
    const ユーザーid = c.get("ユーザーid")!;

    await db.query(
      `INSERT INTO テンプレートいいね (テンプレートid, ユーザーid)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [テンプレートid, ユーザーid]
    );
    return c.json({ ok: true });
  });

  // いいね取消
  ルーター.delete("/:id/likes", 認証必須, async (c) => {
    const テンプレートid = c.req.param("id");
    const ユーザーid = c.get("ユーザーid")!;

    await db.query(
      `DELETE FROM テンプレートいいね WHERE テンプレートid = $1 AND ユーザーid = $2`,
      [テンプレートid, ユーザーid]
    );
    return c.json({ ok: true });
  });

  // 通報
  ルーター.post("/:id/reports", 認証必須, async (c) => {
    const テンプレートid = c.req.param("id");
    const ユーザーid = c.get("ユーザーid")!;
    const body = await c.req.json() as { 理由: string };

    await db.query(
      `INSERT INTO テンプレート通報 (テンプレートid, 通報者id, 理由)
       VALUES ($1, $2, $3)`,
      [テンプレートid, ユーザーid, body.理由 ?? ""]
    );
    return c.json({ ok: true }, 201);
  });

  return ルーター;
};
