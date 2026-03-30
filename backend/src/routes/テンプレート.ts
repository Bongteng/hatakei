import { Hono } from "hono";
import { Pool } from "pg";
import type { 環境変数型 } from "../types.js";
import { 認証必須 } from "../middleware/認証.js";

const ひらがなをカタカナに変換する = (str: string): string =>
  str.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));

const カタカナをひらがなに変換する = (str: string): string =>
  str.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

export const テンプレートルーターを作る = (db: Pool) => {
  const ルーター = new Hono<環境変数型>();

  // 一覧・検索
  ルーター.get("/", async (c) => {
    const q = c.req.query("q") ?? "";
    const tag = c.req.query("tag") ?? "";
    const rawSort = c.req.query("sort");
    const sort = rawSort === "newest" ? "newest"
      : rawSort === "timing" ? "timing"
      : rawSort === "kana" ? "kana"
      : "likes";
    const ユーザーid = c.get("ユーザーid");

    // メインクエリ: テンプレート + いいね数 + 野菜情報
    const orderBy = sort === "newest" || sort === "timing" || sort === "kana"
      ? "t.作成日時 DESC"
      : "いいね数 DESC, t.作成日時 DESC";

    let where = "WHERE 1=1";
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (q) {
      // ひらがな・カタカナ双方でヒットするよう両形式を検索
      const 検索形式一覧 = [...new Set([q, ひらがなをカタカナに変換する(q), カタカナをひらがなに変換する(q)])];
      const 条件 = 検索形式一覧
        .map((_, i) => `(t.テンプレート名 ILIKE $${paramIndex + i} OR v.名称 ILIKE $${paramIndex + i})`)
        .join(" OR ");
      where += ` AND (${条件})`;
      検索形式一覧.forEach((形式) => params.push(`%${形式}%`));
      paramIndex += 検索形式一覧.length;
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
      `SELECT テンプレートid, id, イベント名, 開始週, 終了週, 出典
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
    type イベント行 = { テンプレートid: string; id: string; イベント名: string; 開始週: number; 終了週: number; 出典: string | null };
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
        出典: e.出典 ?? "",
      })),
      タグ一覧: タグMap.get(t.id) ?? [],
      いいね済み: いいね済みSet.has(t.id),
    }));

    if (sort === "timing") {
      // 月別開始週（frontend/src/utils/週変換.ts と同じ定義）
      const 月別開始週: Record<number, number> = {
        1: 1, 2: 6, 3: 10, 4: 14, 5: 19, 6: 23,
        7: 27, 8: 32, 9: 36, 10: 40, 11: 45, 12: 49,
      };
      const 月別週数: Record<number, number> = {
        1: 5, 2: 4, 3: 4, 4: 5, 5: 4, 6: 4,
        7: 5, 8: 4, 9: 4, 10: 5, 11: 4, 12: 4,
      };

      // 現在週（年内1-52）を今日の日付から算出
      const 今日 = new Date();
      const 月 = 今日.getMonth() + 1;
      const 日 = 今日.getDate();
      const 月の日数 = new Date(今日.getFullYear(), 月, 0).getDate();
      const 月の週数 = 月別週数[月] ?? 4;
      const 月内週番号 = Math.min(Math.floor((日 - 1) * 月の週数 / 月の日数), 月の週数 - 1);
      const 現在週 = (月別開始週[月] ?? 1) + 月内週番号;

      type ソート用イベント = { id: string; イベント名: string; 開始週: number; 終了週: number };

      // 開始時期を生の年内週（1-52）で返す
      const 開始時期を求める = (イベント一覧: ソート用イベント[]): number => {
        if (イベント一覧.length === 0) return -1;

        const 準備キーワード = ["土づくり", "種まき", "育苗", "定植"];
        const 準備イベント = イベント一覧.filter((e) =>
          準備キーワード.some((k) => e.イベント名.includes(k))
        );
        if (準備イベント.length > 0) {
          return Math.min(...準備イベント.map((e) => e.開始週));
        }

        const 収穫 = イベント一覧.find((e) => e.イベント名.includes("収穫"));
        if (収穫) {
          const 後続 = イベント一覧
            .filter((e) => e.id !== 収穫.id)
            .map((e) => ({ ...e, 比較週: e.開始週 > 収穫.終了週 ? e.開始週 : e.開始週 + 52 }))
            .sort((a, b) => a.比較週 - b.比較週);
          if (後続.length > 0) return 後続[0].開始週;
        }

        return Math.min(...イベント一覧.map((e) => e.開始週));
      };

      // 現在週を起点として未来方向に近い順（過去方向は52週先として扱う）
      const 近さを求める = (開始週: number): number => {
        if (開始週 < 0) return 999;
        return (開始週 - 現在週 + 52) % 52;
      };

      結果.sort((a, b) =>
        近さを求める(開始時期を求める(a.イベント一覧)) -
        近さを求める(開始時期を求める(b.イベント一覧))
      );
    }

    if (sort === "kana") {
      結果.sort((a, b) => a.テンプレート名.localeCompare(b.テンプレート名, "ja"));
    }

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
