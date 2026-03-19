import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Google } from "arctic";
import { Pool } from "pg";
import type { 環境変数型 } from "../types.js";

const SESSION_COOKIE名 = "hatakei_session";

type セッションペイロード = {
  ユーザーid: string;
  表示名: string;
};

const セッションを暗号化する = async (
  ペイロード: セッションペイロード,
  秘密鍵: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(秘密鍵.padEnd(32, "0").slice(0, 32)),
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const データ = encoder.encode(JSON.stringify(ペイロード));
  const 暗号化済み = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    データ
  );
  const 結合 = new Uint8Array(iv.length + 暗号化済み.byteLength);
  結合.set(iv, 0);
  結合.set(new Uint8Array(暗号化済み), iv.length);
  return Buffer.from(結合).toString("base64url");
};

export const セッションを復号する = async (
  トークン: string,
  秘密鍵: string
): Promise<セッションペイロード | null> => {
  try {
    const encoder = new TextEncoder();
    const 結合 = Buffer.from(トークン, "base64url");
    const iv = 結合.subarray(0, 12);
    const 暗号化済み = 結合.subarray(12);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(秘密鍵.padEnd(32, "0").slice(0, 32)),
      "AES-GCM",
      false,
      ["decrypt"]
    );
    const 復号済み = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      keyMaterial,
      暗号化済み
    );
    return JSON.parse(new TextDecoder().decode(復号済み)) as セッションペイロード;
  } catch {
    return null;
  }
};

export const 認証ルーターを作る = (db: Pool) => {
  const ルーター = new Hono<環境変数型>();

  const googleを取得する = () =>
    new Google(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

  // OAuth開始
  ルーター.get("/google", async (c) => {
    const google = googleを取得する();
    const state = crypto.randomUUID();
    const codeVerifier = crypto.randomUUID();
    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "email",
      "profile",
    ]);

    setCookie(c, "oauth_state", state, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 600,
      path: "/",
    });
    setCookie(c, "oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 600,
      path: "/",
    });

    return c.redirect(url.toString());
  });

  // OAuthコールバック
  ルーター.get("/google/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const 保存済みState = getCookie(c, "oauth_state");
    const codeVerifier = getCookie(c, "oauth_code_verifier");

    deleteCookie(c, "oauth_state", { path: "/" });
    deleteCookie(c, "oauth_code_verifier", { path: "/" });

    if (!code || !state || state !== 保存済みState || !codeVerifier) {
      return c.json({ error: "認証に失敗しました" }, 400);
    }

    const google = googleを取得する();
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    // UserInfo API呼び出し
    const userInfoレスポンス = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const userInfo = (await userInfoレスポンス.json()) as {
      email: string;
      name: string;
    };

    // ユーザーUPSERT
    await db.query(
      `INSERT INTO ユーザー (id, 表示名)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET 表示名 = $2`,
      [userInfo.email, userInfo.name]
    );

    // 匿名タイムラインの引き継ぎ
    const 匿名id = c.get("匿名id");
    if (匿名id) {
      await db.query(
        `UPDATE タイムライン SET 所有者id = $1, 匿名Cookie = NULL
         WHERE 匿名Cookie = $2 AND 所有者id IS NULL`,
        [userInfo.email, 匿名id]
      );
    }

    // セッションCookie発行
    const セッション = await セッションを暗号化する(
      { ユーザーid: userInfo.email, 表示名: userInfo.name },
      process.env.SESSION_SECRET!
    );
    setCookie(c, SESSION_COOKIE名, セッション, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60, // 30日
      path: "/",
    });

    const フロントURL = process.env.FRONTEND_URL ?? "http://localhost:5173";
    return c.redirect(フロントURL);
  });

  // ログアウト
  ルーター.post("/logout", (c) => {
    deleteCookie(c, SESSION_COOKIE名, { path: "/" });
    return c.json({ ok: true });
  });

  // 自分の情報
  ルーター.get("/me", (c) => {
    const ユーザーid = c.get("ユーザーid");
    if (!ユーザーid) {
      return c.json({ ユーザー: null });
    }
    return c.json({ ユーザー: { id: ユーザーid } });
  });

  return ルーター;
};
