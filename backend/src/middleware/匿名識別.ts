import { createMiddleware } from "hono/factory";
import { setCookie, getCookie } from "hono/cookie";
import type { 環境変数型 } from "../types.js";

const COOKIE名 = "hatakei_anon";
const 有効期間秒 = 90 * 24 * 60 * 60; // 90日

export const 匿名識別 = createMiddleware<環境変数型>(async (c, next) => {
  let 匿名id = getCookie(c, COOKIE名);

  if (!匿名id) {
    匿名id = crypto.randomUUID();
    setCookie(c, COOKIE名, 匿名id, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 有効期間秒,
      path: "/",
    });
  }

  c.set("匿名id", 匿名id);
  await next();
});
