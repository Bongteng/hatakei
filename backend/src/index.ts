import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";
import { テーブル作成SQL } from "./db/スキーマ.js";
import { 初期野菜データ } from "./db/シード.js";
import { 野菜ルーターを作る } from "./routes/野菜.js";

const db = new Pool({ connectionString: process.env.DATABASE_URL });

const DBを初期化する = async () => {
  await db.query(テーブル作成SQL);

  const { rows } = await db.query("SELECT COUNT(*) FROM 野菜");
  if (parseInt(rows[0].count) === 0) {
    for (const 野菜 of 初期野菜データ) {
      await db.query(
        `INSERT INTO 野菜 (名前, 色, カテゴリ, 種まき開始週, 種まき終了週, 収穫開始週, 収穫終了週, 標準栽培週数)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [野菜.名前, 野菜.色, 野菜.カテゴリ, 野菜.種まき開始週, 野菜.種まき終了週, 野菜.収穫開始週, 野菜.収穫終了週, 野菜.標準栽培週数]
      );
    }
    console.log(`野菜プリセット ${初期野菜データ.length} 件を投入しました`);
  }
};

const アプリ = new Hono();

アプリ.use(cors({
  origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
}));

アプリ.route("/api/野菜", 野菜ルーターを作る(db));

アプリ.get("/health", (コンテキスト) => コンテキスト.json({ status: "ok" }));

const ポート = parseInt(process.env.PORT ?? "3000");

DBを初期化する()
  .then(() => {
    serve({ fetch: アプリ.fetch, port: ポート });
    console.log(`サーバー起動: http://localhost:${ポート}`);
  })
  .catch((エラー) => {
    console.error("DB初期化エラー:", エラー);
    process.exit(1);
  });
