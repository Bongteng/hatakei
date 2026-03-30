import { Hono } from "hono";
import { Pool } from "pg";
import type { 環境変数型 } from "../types.js";
import { 認証必須 } from "../middleware/認証.js";

export const タイムラインルーターを作る = (db: Pool) => {
  const ルーター = new Hono<環境変数型>();

  // --- タイムライン ---

  // 自分のタイムライン一覧
  ルーター.get("/", async (c) => {
    const ユーザーid = c.get("ユーザーid");
    const 匿名id = c.get("匿名id");

    const { rows } = await db.query(
      `SELECT id, 名前, 所有者id, 匿名Cookie, 作成日時, 最終編集日時
       FROM タイムライン
       WHERE 所有者id = $1 OR ($1 IS NULL AND 匿名Cookie = $2)
       ORDER BY 最終編集日時 DESC`,
      [ユーザーid, 匿名id]
    );
    return c.json(rows);
  });

  // タイムライン作成
  ルーター.post("/", async (c) => {
    const ユーザーid = c.get("ユーザーid");
    const 匿名id = c.get("匿名id");
    const body = await c.req.json() as { 名前?: string };

    const { rows } = await db.query(
      `INSERT INTO タイムライン (名前, 所有者id, 匿名Cookie)
       VALUES ($1, $2, $3) RETURNING *`,
      [body.名前 ?? "無題のタイムライン", ユーザーid, ユーザーid ? null : 匿名id]
    );
    return c.json(rows[0], 201);
  });

  // タイムライン詳細取得（スケジュール+イベント込み）
  ルーター.get("/:id", async (c) => {
    const id = c.req.param("id");

    const tl結果 = await db.query(
      `SELECT id, 名前, 所有者id, 匿名Cookie, 作成日時, 最終編集日時
       FROM タイムライン WHERE id = $1`,
      [id]
    );
    if (tl結果.rows.length === 0) return c.json({ error: "見つかりません" }, 404);

    const スケジュール結果 = await db.query(
      `SELECT id, 野菜id, 表示順
       FROM スケジュール WHERE タイムラインid = $1
       ORDER BY 表示順`,
      [id]
    );

    const スケジュールids = スケジュール結果.rows.map((r: { id: string }) => r.id);

    let イベントMap = new Map<string, { id: string; イベント名: string; 開始週: number; 終了週: number; コメント: string | null }[]>();
    if (スケジュールids.length > 0) {
      const イベント結果 = await db.query(
        `SELECT id, スケジュールid, イベント名, 開始週, 終了週, コメント
         FROM イベント WHERE スケジュールid = ANY($1)`,
        [スケジュールids]
      );
      for (const row of イベント結果.rows as { id: string; スケジュールid: string; イベント名: string; 開始週: number; 終了週: number; コメント: string | null }[]) {
        const list = イベントMap.get(row.スケジュールid) ?? [];
        list.push({ id: row.id, イベント名: row.イベント名, 開始週: row.開始週, 終了週: row.終了週, コメント: row.コメント });
        イベントMap.set(row.スケジュールid, list);
      }
    }

    const タイムライン = {
      ...tl結果.rows[0],
      スケジュール一覧: (スケジュール結果.rows as { id: string; 野菜id: string; 表示順: number }[]).map((s) => ({
        id: s.id,
        野菜id: s.野菜id,
        イベント一覧: イベントMap.get(s.id) ?? [],
      })),
    };

    return c.json(タイムライン);
  });

  // タイムライン更新（名前）
  ルーター.put("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json() as { 名前: string };

    await db.query(
      `UPDATE タイムライン SET 名前 = $1, 最終編集日時 = NOW() WHERE id = $2`,
      [body.名前, id]
    );
    return c.json({ ok: true });
  });

  // タイムライン削除
  ルーター.delete("/:id", 認証必須, async (c) => {
    const id = c.req.param("id");
    const ユーザーid = c.get("ユーザーid")!;

    const { rows } = await db.query(
      `SELECT 所有者id FROM タイムライン WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) return c.json({ error: "見つかりません" }, 404);
    if (rows[0].所有者id !== ユーザーid) return c.json({ error: "権限がありません" }, 403);

    await db.query(`DELETE FROM タイムライン WHERE id = $1`, [id]);
    return c.json({ ok: true });
  });

  // --- スケジュール ---

  // スケジュール追加
  ルーター.post("/:id/schedules", async (c) => {
    const タイムラインid = c.req.param("id");
    const body = await c.req.json() as { 野菜id: string };

    // 表示順を末尾に
    const 順結果 = await db.query(
      `SELECT COALESCE(MAX(表示順), -1) + 1 AS 次 FROM スケジュール WHERE タイムラインid = $1`,
      [タイムラインid]
    );
    const 表示順 = (順結果.rows[0] as { 次: number }).次;

    const { rows } = await db.query(
      `INSERT INTO スケジュール (タイムラインid, 野菜id, 表示順)
       VALUES ($1, $2, $3) RETURNING id`,
      [タイムラインid, body.野菜id, 表示順]
    );

    await db.query(
      `UPDATE タイムライン SET 最終編集日時 = NOW() WHERE id = $1`,
      [タイムラインid]
    );

    return c.json({ id: rows[0].id, 野菜id: body.野菜id, イベント一覧: [] }, 201);
  });

  // スケジュール削除
  ルーター.delete("/:id/schedules/:sid", async (c) => {
    const タイムラインid = c.req.param("id");
    const スケジュールid = c.req.param("sid");

    await db.query(`DELETE FROM スケジュール WHERE id = $1 AND タイムラインid = $2`, [スケジュールid, タイムラインid]);
    await db.query(`UPDATE タイムライン SET 最終編集日時 = NOW() WHERE id = $1`, [タイムラインid]);

    return c.json({ ok: true });
  });

  // 並び順変更
  ルーター.put("/:id/order", async (c) => {
    const タイムラインid = c.req.param("id");
    const body = await c.req.json() as { スケジュールids: string[] };

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      for (let i = 0; i < body.スケジュールids.length; i++) {
        await client.query(
          `UPDATE スケジュール SET 表示順 = $1 WHERE id = $2 AND タイムラインid = $3`,
          [i, body.スケジュールids[i], タイムラインid]
        );
      }
      await client.query(`UPDATE タイムライン SET 最終編集日時 = NOW() WHERE id = $1`, [タイムラインid]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return c.json({ ok: true });
  });

  // --- イベント ---

  // イベント追加
  ルーター.post("/:id/schedules/:sid/events", async (c) => {
    const タイムラインid = c.req.param("id");
    const スケジュールid = c.req.param("sid");
    const body = await c.req.json() as { イベント名: string; 開始週: number; 終了週: number; コメント?: string };

    const { rows } = await db.query(
      `INSERT INTO イベント (スケジュールid, イベント名, 開始週, 終了週, コメント)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [スケジュールid, body.イベント名, body.開始週, body.終了週, body.コメント ?? null]
    );

    await db.query(`UPDATE タイムライン SET 最終編集日時 = NOW() WHERE id = $1`, [タイムラインid]);

    return c.json({
      id: rows[0].id,
      イベント名: body.イベント名,
      開始週: body.開始週,
      終了週: body.終了週,
      コメント: body.コメント ?? null,
    }, 201);
  });

  // イベント更新
  ルーター.put("/:id/schedules/:sid/events/:eid", async (c) => {
    const タイムラインid = c.req.param("id");
    const イベントid = c.req.param("eid");
    const body = await c.req.json() as { イベント名?: string; 開始週?: number; 終了週?: number; コメント?: string | null };

    const sets: string[] = [];
    const params: (string | number | null)[] = [];
    let idx = 1;

    if (body.イベント名 !== undefined) { sets.push(`イベント名 = $${idx++}`); params.push(body.イベント名); }
    if (body.開始週 !== undefined) { sets.push(`開始週 = $${idx++}`); params.push(body.開始週); }
    if (body.終了週 !== undefined) { sets.push(`終了週 = $${idx++}`); params.push(body.終了週); }
    if (body.コメント !== undefined) { sets.push(`コメント = $${idx++}`); params.push(body.コメント); }

    if (sets.length > 0) {
      params.push(イベントid);
      await db.query(`UPDATE イベント SET ${sets.join(", ")} WHERE id = $${idx}`, params);
      await db.query(`UPDATE タイムライン SET 最終編集日時 = NOW() WHERE id = $1`, [タイムラインid]);
    }

    return c.json({ ok: true });
  });

  // イベント削除
  ルーター.delete("/:id/schedules/:sid/events/:eid", async (c) => {
    const タイムラインid = c.req.param("id");
    const イベントid = c.req.param("eid");

    await db.query(`DELETE FROM イベント WHERE id = $1`, [イベントid]);
    await db.query(`UPDATE タイムライン SET 最終編集日時 = NOW() WHERE id = $1`, [タイムラインid]);

    return c.json({ ok: true });
  });

  return ルーター;
};
