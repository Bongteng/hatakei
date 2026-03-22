import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";
import { テーブル作成SQL } from "./db/スキーマ.js";
import { 初期野菜データ } from "./db/シード.js";
import { 野菜ルーターを作る } from "./routes/野菜.js";
import { 認証ルーターを作る } from "./routes/認証.js";
import { テンプレートルーターを作る } from "./routes/テンプレート.js";
import { タイムラインルーターを作る } from "./routes/タイムライン.js";
import { 匿名識別 } from "./middleware/匿名識別.js";
import { 認証任意 } from "./middleware/認証.js";
import type { 環境変数型 } from "./types.js";

const db = new Pool({ connectionString: process.env.DATABASE_URL });

const DBを初期化する = async () => {
  await db.query(テーブル作成SQL);

  const { rows } = await db.query("SELECT COUNT(*) FROM 野菜");
  if (parseInt(rows[0].count) === 0) {
    for (const 野菜 of 初期野菜データ) {
      await db.query(
        `INSERT INTO 野菜 (名称, 色, カスタム) VALUES ($1, $2, FALSE)`,
        [野菜.名称, 野菜.色]
      );
    }
    console.log(`野菜プリセット ${初期野菜データ.length} 件を投入しました`);
  }
};

const アプリ = new Hono<環境変数型>();

アプリ.use(cors({
  origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
  credentials: true,
}));

アプリ.use(匿名識別);
アプリ.use(認証任意);

アプリ.route("/api/vegetables", 野菜ルーターを作る(db));
アプリ.route("/api/auth", 認証ルーターを作る(db));
アプリ.route("/api/templates", テンプレートルーターを作る(db));
アプリ.route("/api/timelines", タイムラインルーターを作る(db));

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
