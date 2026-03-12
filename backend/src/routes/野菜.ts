import { Hono } from "hono";
import { Pool } from "pg";

export const 野菜ルーターを作る = (db: Pool) => {
  const ルーター = new Hono();

  ルーター.get("/", async (コンテキスト) => {
    const 結果 = await db.query(`
      SELECT
        id,
        名前,
        アイコンURL AS "アイコンURL",
        色,
        カテゴリ,
        種まき開始週 AS "種まき開始週",
        種まき終了週 AS "種まき終了週",
        収穫開始週   AS "収穫開始週",
        収穫終了週   AS "収穫終了週",
        標準栽培週数 AS "標準栽培週数"
      FROM 野菜
      ORDER BY カテゴリ, 名前
    `);
    return コンテキスト.json(結果.rows);
  });

  return ルーター;
};
