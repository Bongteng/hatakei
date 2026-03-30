import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";
import { テーブル作成SQL } from "./db/スキーマ.js";
import { 初期野菜データ, テンプレートシードデータを読み込む } from "./db/シード.js";
import { 野菜ルーターを作る } from "./routes/野菜.js";
import { 認証ルーターを作る } from "./routes/認証.js";
import { テンプレートルーターを作る } from "./routes/テンプレート.js";
import { タイムラインルーターを作る } from "./routes/タイムライン.js";
import { googleカレンダールーターを作る } from "./routes/googleカレンダー.js";
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

  // テンプレートシード
  const { rows: テンプレート数 } = await db.query("SELECT COUNT(*) FROM スケジュールテンプレート");
  if (parseInt(テンプレート数[0].count) === 0) {
    // システムユーザーを取得（最初の1件）
    const { rows: ユーザー } = await db.query("SELECT id FROM ユーザー LIMIT 1");
    if (ユーザー.length > 0) {
      const システムユーザーid = ユーザー[0].id as string;
      const シードデータ = テンプレートシードデータを読み込む();

      for (const テンプレート of シードデータ) {
        // 野菜を名称で検索（括弧付き名称は基本名でも検索）
        const 基本野菜名 = テンプレート.野菜名.replace(/[（(].+[）)]$/, "");
        const { rows: 野菜結果 } = await db.query(
          `SELECT id FROM 野菜 WHERE 名称 = $1 OR 名称 = $2 LIMIT 1`,
          [テンプレート.野菜名, 基本野菜名]
        );

        let 野菜id: string;
        if (野菜結果.length > 0) {
          野菜id = 野菜結果[0].id as string;
        } else {
          // 存在しなければ追加
          const { rows: 新野菜 } = await db.query(
            `INSERT INTO 野菜 (名称, 色, カスタム) VALUES ($1, '#888888', FALSE) RETURNING id`,
            [基本野菜名]
          );
          野菜id = 新野菜[0].id as string;
        }

        const { rows: 新テンプレート } = await db.query(
          `INSERT INTO スケジュールテンプレート (テンプレート名, 説明文, 野菜id, 作成者id)
           VALUES ($1, '', $2, $3) RETURNING id`,
          [テンプレート.テンプレート名, 野菜id, システムユーザーid]
        );
        const テンプレートid = 新テンプレート[0].id as string;

        for (const ev of テンプレート.イベント一覧) {
          await db.query(
            `INSERT INTO テンプレートイベント (テンプレートid, イベント名, 開始週, 終了週, 出典)
             VALUES ($1, $2, $3, $4, $5)`,
            [テンプレートid, ev.イベント名, ev.開始週, ev.終了週, ev.出典]
          );
        }
      }
      console.log(`テンプレート ${シードデータ.length} 件を投入しました`);
    }
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
アプリ.route("/api/gcal", googleカレンダールーターを作る(db));

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
