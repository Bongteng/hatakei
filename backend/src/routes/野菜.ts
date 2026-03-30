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

  ルーター.put("/:id", async (コンテキスト) => {
    const id = コンテキスト.req.param("id");
    const body = await コンテキスト.req.json() as { 名称?: string; 色?: string };

    const セット句 = [];
    const 値 = [];
    let インデックス = 1;

    if (body.名称 !== undefined) {
      セット句.push(`名称 = $${インデックス++}`);
      値.push(body.名称);
    }
    if (body.色 !== undefined) {
      セット句.push(`色 = $${インデックス++}`);
      値.push(body.色);
    }

    if (セット句.length === 0) return コンテキスト.json({ error: "変更なし" }, 400);

    値.push(id);
    const { rows } = await db.query(
      `UPDATE 野菜 SET ${セット句.join(", ")} WHERE id = $${インデックス} RETURNING id, 名称, 色, カスタム`,
      値
    );

    if (rows.length === 0) return コンテキスト.json({ error: "見つかりません" }, 404);
    return コンテキスト.json(rows[0]);
  });

  return ルーター;
};
