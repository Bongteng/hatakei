import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { 環境変数型 } from "../types.js";
import { セッションを復号する } from "../routes/認証.js";

const SESSION_COOKIE名 = "hatakei_session";

export const 認証任意 = createMiddleware<環境変数型>(async (c, next) => {
  const トークン = getCookie(c, SESSION_COOKIE名);
  if (トークン) {
    const セッション = await セッションを復号する(
      トークン,
      process.env.SESSION_SECRET!
    );
    c.set("ユーザーid", セッション?.ユーザーid ?? null);
  } else {
    c.set("ユーザーid", null);
  }
  await next();
});

export const 認証必須 = createMiddleware<環境変数型>(async (c, next) => {
  const ユーザーid = c.get("ユーザーid");
  if (!ユーザーid) {
    return c.json({ error: "認証が必要です" }, 401);
  }
  await next();
});
