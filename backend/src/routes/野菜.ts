import { Hono } from "hono";
import { Pool } from "pg";

export const 野菜ルーターを作る = (db: Pool) => {
  const ルーター = new Hono();

  ルーター.get("/", async (コンテキスト) => {
    const 結果 = await db.query(`
      SELECT id, 名称, 色, カスタム
      FROM 野菜
      ORDER BY 名称
    `);
    return コンテキスト.json(結果.rows);
  });

  return ルーター;
};
