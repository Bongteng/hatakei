import { Hono } from "hono";
import { Pool } from "pg";
import { Google } from "arctic";
import type { 環境変数型 } from "../types.js";

// フロントエンドと共通の週インデックス定数
const 月別開始インデックス: Record<number, number> = {
  1: 1, 2: 6, 3: 10, 4: 14, 5: 19, 6: 23,
  7: 27, 8: 32, 9: 36, 10: 40, 11: 45, 12: 49,
};
const 月別週数: Record<number, number> = {
  1: 5, 2: 4, 3: 4, 4: 5, 5: 4, 6: 4,
  7: 5, 8: 4, 9: 4, 10: 5, 11: 4, 12: 4,
};
const 基準年 = 2026;

const 月週を週インデックスに変換する = (年: number, 月: number, 週番号: number): number =>
  (年 - 基準年) * 52 + (月別開始インデックス[月] ?? 1) + 週番号;

const 週インデックスを月週に変換する = (週インデックス: number): { 年: number; 月: number; 週番号: number } => {
  const 年オフセット = Math.floor((週インデックス - 1) / 52);
  const 年内インデックス = ((週インデックス - 1) % 52) + 1;

  let 見つかった月 = 12;
  for (const m of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const) {
    const 開始 = 月別開始インデックス[m] ?? 1;
    const 次の開始 = m < 12 ? (月別開始インデックス[m + 1] ?? 53) : 53;
    if (年内インデックス >= 開始 && 年内インデックス < 次の開始) {
      見つかった月 = m;
      break;
    }
  }

  return {
    年: 基準年 + 年オフセット,
    月: 見つかった月,
    週番号: 年内インデックス - (月別開始インデックス[見つかった月] ?? 1),
  };
};

// M月第(週番号+1)土曜日を返す。その月に存在しなければ翌月第1土曜日
const 土曜日を取得する = (年: number, 月: number, 週番号: number): Date => {
  const n = 週番号 + 1;
  const firstDayOfWeek = new Date(年, 月 - 1, 1).getDay(); // 0=Sun, 6=Sat
  const firstSaturday = 1 + ((6 - firstDayOfWeek + 7) % 7);
  const nthSaturday = firstSaturday + (n - 1) * 7;
  const candidate = new Date(年, 月 - 1, nthSaturday);

  if (candidate.getMonth() !== 月 - 1) {
    // この月に第N土曜日が存在しない → 翌月第1土曜日
    return 土曜日を取得する(月 === 12 ? 年 + 1 : 年, 月 === 12 ? 1 : 月 + 1, 0);
  }
  return candidate;
};

const ISO日付に変換する = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const googleを取得する = () =>
  new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

// 401時にトークンをリフレッシュして再試行するfetchラッパー
const gcalFetch = async (
  url: string,
  init: RequestInit,
  ユーザーid: string,
  リフレッシュトークン: string,
  db: Pool,
  アクセストークン: { value: string }
): Promise<Response> => {
  const resp = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${アクセストークン.value}` },
  });

  if (resp.status !== 401) return resp;

  // 401: リフレッシュして再試行
  console.error(`[GCal] アクセストークン期限切れ。リフレッシュ開始 ユーザー=${ユーザーid} url=${url}`);
  try {
    const newTokens = await googleを取得する().refreshAccessToken(リフレッシュトークン);
    アクセストークン.value = newTokens.accessToken();
    await db.query(`UPDATE ユーザー SET アクセストークン = $1 WHERE id = $2`, [アクセストークン.value, ユーザーid]);
    console.log(`[GCal] トークンリフレッシュ成功 ユーザー=${ユーザーid}`);
  } catch (e) {
    console.error(`[GCal] トークンリフレッシュ失敗 ユーザー=${ユーザーid}`, e);
    throw e;
  }

  return fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${アクセストークン.value}` },
  });
};

class GCalScopeError extends Error {
  constructor() { super("calendarスコープなし"); }
}

const hatakeiカレンダーidを確保する = async (
  アクセストークン: { value: string },
  ユーザーid: string,
  リフレッシュトークン: string,
  db: Pool
): Promise<string> => {
  const listResp = await gcalFetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {},
    ユーザーid, リフレッシュトークン, db, アクセストークン
  );
  if (!listResp.ok) {
    const body = await listResp.text();
    console.error(`[GCal] カレンダー一覧取得失敗 ユーザー=${ユーザーid} status=${listResp.status} body=${body}`);
    if (listResp.status === 403) throw new GCalScopeError();
    throw new Error(`カレンダー一覧取得失敗: ${listResp.status}`);
  }

  const list = await listResp.json() as { items?: { id: string; summary: string }[] };
  const existing = list.items?.find((cal) => cal.summary === "hatakei");
  if (existing) {
    console.log(`[GCal] 既存のhatakeiカレンダーを削除 id=${existing.id} ユーザー=${ユーザーid}`);
    const deleteResp = await gcalFetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(existing.id)}`,
      { method: "DELETE" },
      ユーザーid, リフレッシュトークン, db, アクセストークン
    );
    if (!deleteResp.ok && deleteResp.status !== 204) {
      const body = await deleteResp.text();
      console.error(`[GCal] カレンダー削除失敗 id=${existing.id} status=${deleteResp.status} body=${body}`);
      throw new Error(`カレンダー削除失敗: ${deleteResp.status}`);
    }
    console.log(`[GCal] カレンダー削除成功 id=${existing.id}`);
  }

  // 新規作成
  console.log(`[GCal] hatakeiカレンダー新規作成 ユーザー=${ユーザーid}`);
  const createResp = await gcalFetch(
    "https://www.googleapis.com/calendar/v3/calendars",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: "hatakei" }),
    },
    ユーザーid, リフレッシュトークン, db, アクセストークン
  );
  if (!createResp.ok) {
    const body = await createResp.text();
    console.error(`[GCal] カレンダー作成失敗 ユーザー=${ユーザーid} status=${createResp.status} body=${body}`);
    throw new Error(`カレンダー作成失敗: ${createResp.status}`);
  }

  const created = await createResp.json() as { id: string };
  console.log(`[GCal] hatakeiカレンダー作成成功 id=${created.id} ユーザー=${ユーザーid}`);
  return created.id;
};

export const googleカレンダールーターを作る = (db: Pool) => {
  const ルーター = new Hono<環境変数型>();

  ルーター.post("/export", async (c) => {
    const ユーザーid = c.get("ユーザーid");
    if (!ユーザーid) {
      console.warn("[GCal] 未ログインユーザーからのエクスポートリクエスト");
      return c.json({ error: "ログインが必要です" }, 401);
    }

    const body = await c.req.json() as {
      タイムラインid: string;
      開始年: number;
      開始月: number;
      終了年: number;
      終了月: number;
    };
    console.log(`[GCal] エクスポート開始 ユーザー=${ユーザーid} タイムライン=${body.タイムラインid} 期間=${body.開始年}/${body.開始月}〜${body.終了年}/${body.終了月}`);

    // トークン確認
    const { rows: userRows } = await db.query(
      `SELECT アクセストークン, リフレッシュトークン FROM ユーザー WHERE id = $1`,
      [ユーザーid]
    );
    const userRow = userRows[0] as { アクセストークン: string | null; リフレッシュトークン: string | null } | undefined;

    if (!userRow?.リフレッシュトークン) {
      console.warn(`[GCal] リフレッシュトークンなし ユーザー=${ユーザーid} userRow存在=${!!userRow}`);
      return c.json({ error: "カレンダー権限がありません。再ログインしてください。", needsReauth: true }, 403);
    }

    // タイムライン取得
    const { rows: tlRows } = await db.query(
      `SELECT id FROM タイムライン WHERE id = $1`,
      [body.タイムラインid]
    );
    if (tlRows.length === 0) {
      console.warn(`[GCal] タイムライン未発見 id=${body.タイムラインid} ユーザー=${ユーザーid}`);
      return c.json({ error: "タイムラインが見つかりません" }, 404);
    }

    // スケジュールと野菜名を取得
    type スケジュール行 = { id: string; 野菜名: string };
    const { rows: スケジュール一覧 } = await db.query<スケジュール行>(
      `SELECT s.id, v.名称 as 野菜名
       FROM スケジュール s JOIN 野菜 v ON v.id = s.野菜id
       WHERE s.タイムラインid = $1 ORDER BY s.表示順`,
      [body.タイムラインid]
    );
    console.log(`[GCal] スケジュール数=${スケジュール一覧.length} タイムライン=${body.タイムラインid}`);

    // イベント取得
    type イベント行 = { id: string; スケジュールid: string; イベント名: string; 開始週: number; 終了週: number; コメント: string | null };
    let イベント一覧: イベント行[] = [];
    const スケジュールids = スケジュール一覧.map((s) => s.id);
    if (スケジュールids.length > 0) {
      const { rows } = await db.query<イベント行>(
        `SELECT id, スケジュールid, イベント名, 開始週, 終了週, コメント
         FROM イベント WHERE スケジュールid = ANY($1)`,
        [スケジュールids]
      );
      イベント一覧 = rows;
    }
    console.log(`[GCal] イベント数=${イベント一覧.length}`);

    // エクスポート週インデックス範囲
    const エクスポート開始週 = 月週を週インデックスに変換する(body.開始年, body.開始月, 0);
    const エクスポート終了週 = 月週を週インデックスに変換する(
      body.終了年, body.終了月, (月別週数[body.終了月] ?? 4) - 1
    );
    console.log(`[GCal] 週インデックス範囲 ${エクスポート開始週}〜${エクスポート終了週}`);

    const アクセストークン = { value: userRow.アクセストークン ?? "" };

    let カレンダーid: string;
    try {
      カレンダーid = await hatakeiカレンダーidを確保する(
        アクセストークン, ユーザーid, userRow.リフレッシュトークン!, db
      );
    } catch (e) {
      if (e instanceof GCalScopeError) {
        console.warn(`[GCal] calendarスコープなし。再ログインが必要 ユーザー=${ユーザーid}`);
        return c.json({ error: "カレンダー権限がありません。再ログインしてください。", needsReauth: true }, 403);
      }
      console.error(`[GCal] カレンダー確保失敗 ユーザー=${ユーザーid}`, e);
      return c.json({ error: "Googleカレンダーへの接続に失敗しました" }, 500);
    }

    // 作成対象を事前に収集して合計数を確定
    // イベントの週インデックスは年内位置（1〜52）で格納されているため、
    // k*52 シフトして export 範囲と重なる年を探す
    type 作成対象 = { タイトル: string; コメント: string; 土曜日: Date; イベントid: string };
    const 作成対象一覧: 作成対象[] = [];
    const baseK = Math.floor((エクスポート開始週 - 1) / 52);
    for (const schedule of スケジュール一覧) {
      for (const ev of イベント一覧.filter((e) => e.スケジュールid === schedule.id)) {
        for (const k of [baseK, baseK + 1]) {
          const 調整開始週 = ev.開始週 + k * 52;
          const 調整終了週 = ev.終了週 + k * 52;
          const 範囲開始 = Math.max(調整開始週, エクスポート開始週);
          const 範囲終了 = Math.min(調整終了週, エクスポート終了週);
          if (範囲開始 > 範囲終了) continue;
          for (let w = 範囲開始; w <= 範囲終了; w++) {
            const { 年, 月, 週番号 } = 週インデックスを月週に変換する(w);
            作成対象一覧.push({
              タイトル: `${schedule.野菜名},${ev.イベント名}`,
              コメント: ev.コメント ?? "",
              土曜日: 土曜日を取得する(年, 月, 週番号),
              イベントid: ev.id,
            });
          }
        }
      }
    }
    const 合計 = 作成対象一覧.length;
    console.log(`[GCal] 作成対象合計=${合計} ユーザー=${ユーザーid}`);

    // SSEストリームで進捗を送信しながらイベントを作成
    const encoder = new TextEncoder();
    const sse = (data: object) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(sse({ type: "start", 合計 }));

        let 作成数 = 0;
        let 失敗数 = 0;
        for (const 対象 of 作成対象一覧) {
          const 月曜日 = new Date(対象.土曜日);
          月曜日.setDate(月曜日.getDate() + 2);

          let resp: Response;
          try {
            resp = await gcalFetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(カレンダーid)}/events`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  summary: 対象.タイトル,
                  description: 対象.コメント,
                  start: { date: ISO日付に変換する(対象.土曜日) },
                  end: { date: ISO日付に変換する(月曜日) },
                }),
              },
              ユーザーid, userRow!.リフレッシュトークン!, db, アクセストークン
            );
          } catch (e) {
            console.error(`[GCal] イベント作成例外 タイトル="${対象.タイトル}" 日付=${ISO日付に変換する(対象.土曜日)} イベントid=${対象.イベントid}`, e);
            失敗数++;
            continue;
          }

          if (resp.ok) {
            作成数++;
          } else {
            const errBody = await resp.text();
            console.error(`[GCal] イベント作成失敗 タイトル="${対象.タイトル}" 日付=${ISO日付に変換する(対象.土曜日)} イベントid=${対象.イベントid} status=${resp.status} body=${errBody}`);
            失敗数++;
          }

          controller.enqueue(sse({ type: "progress", 作成済み: 作成数 + 失敗数, 合計 }));
        }

        console.log(`[GCal] エクスポート完了 ユーザー=${ユーザーid} 作成=${作成数} 失敗=${失敗数}`);
        controller.enqueue(sse({ type: "complete", 作成数 }));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  });

  return ルーター;
};
