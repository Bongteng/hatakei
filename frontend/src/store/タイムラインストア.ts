import { create } from "zustand";
import type { タイムライン, イベント, スケジュール, 週インデックス } from "../types";
import { 月別開始インデックス, 月週を週インデックスに変換する, 基準年 } from "../utils/週変換";

type タイムラインストア = {
  タイムライン一覧: タイムライン[];
  アクティブタイムラインid: string | null;
  現在週: 週インデックス;
  読み込み中: boolean;
  表示開始年: number;
  表示開始月: number;
  開始週インデックス: number;

  タイムライン一覧を取得する: () => Promise<void>;
  タイムラインを取得する: (id: string) => Promise<void>;
  アクティブタイムラインidを設定する: (id: string) => void;
  現在週を設定する: (週: 週インデックス) => void;
  表示開始月を設定する: (年: number, 月: number) => void;
  タイムラインを作成する: (名前: string) => Promise<string>;
  スケジュールを追加する: (タイムラインid: string, 野菜id: string) => Promise<void>;
  スケジュールを削除する: (タイムラインid: string, スケジュールid: string) => Promise<void>;
  イベントを追加する: (タイムラインid: string, スケジュールid: string, イベント: Omit<イベント, "id">) => Promise<void>;
  イベントを削除する: (タイムラインid: string, スケジュールid: string, イベントid: string) => Promise<void>;
  イベントを更新する: (タイムラインid: string, スケジュールid: string, イベントid: string, 更新: Partial<Omit<イベント, "id">>) => Promise<void>;
};

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const api = async <T>(パス: string, オプション?: RequestInit): Promise<T> => {
  const レスポンス = await fetch(`${APIのベースURL}/api/timelines${パス}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...オプション,
  });
  return レスポンス.json() as Promise<T>;
};

const 今日の週インデックスを求める = (): 週インデックス => {
  const 今日 = new Date();
  const 年 = 今日.getFullYear();
  const 月 = 今日.getMonth() + 1;
  const 日 = 今日.getDate();
  const 週番号 = Math.floor((日 - 1) / 7);
  const 年オフセット = Math.max(0, 年 - 基準年);
  return 年オフセット * 52 + (月別開始インデックス[月] ?? 1) + 週番号;
};

const 初期表示開始年 = 基準年;
const 初期表示開始月 = 1;

// ストア内のタイムラインを更新するヘルパー
const タイムラインを差し替える = (
  一覧: タイムライン[],
  id: string,
  変換: (tl: タイムライン) => タイムライン
): タイムライン[] => 一覧.map((tl) => (tl.id === id ? 変換(tl) : tl));

export const タイムラインストアを使う = create<タイムラインストア>()((set, get) => ({
  タイムライン一覧: [],
  アクティブタイムラインid: null,
  現在週: 今日の週インデックスを求める(),
  読み込み中: false,
  表示開始年: 初期表示開始年,
  表示開始月: 初期表示開始月,
  開始週インデックス: 月週を週インデックスに変換する(初期表示開始年, 初期表示開始月, 0),

  タイムライン一覧を取得する: async () => {
    set({ 読み込み中: true });
    try {
      type 一覧応答 = { id: string; 名前: string; 所有者id: string | null; 匿名cookie: string | null; 作成日時: string; 最終編集日時: string }[];
      const rows = await api<一覧応答>("");

      if (rows.length === 0) {
        // タイムラインがなければ新規作成
        const 新tl = await api<タイムライン>("", {
          method: "POST",
          body: JSON.stringify({ 名前: "マイタイムライン" }),
        });
        // 詳細を取得
        const 詳細 = await api<タイムライン>(`/${新tl.id}`);
        set({ タイムライン一覧: [詳細], アクティブタイムラインid: 詳細.id });
      } else {
        // 最初のタイムラインの詳細を取得
        const 詳細 = await api<タイムライン>(`/${rows[0].id}`);
        set({ タイムライン一覧: [詳細], アクティブタイムラインid: 詳細.id });
      }
    } catch {
      // API接続できない場合はローカルフォールバック
      const id = crypto.randomUUID();
      set({
        タイムライン一覧: [{
          id,
          名前: "マイタイムライン",
          スケジュール一覧: [],
          所有者id: null,
          作成日時: new Date().toISOString(),
          最終編集日時: new Date().toISOString(),
        }],
        アクティブタイムラインid: id,
      });
    } finally {
      set({ 読み込み中: false });
    }
  },

  タイムラインを取得する: async (id) => {
    const 詳細 = await api<タイムライン>(`/${id}`);
    set((状態) => ({
      タイムライン一覧: 状態.タイムライン一覧.some((tl) => tl.id === id)
        ? タイムラインを差し替える(状態.タイムライン一覧, id, () => 詳細)
        : [...状態.タイムライン一覧, 詳細],
    }));
  },

  アクティブタイムラインidを設定する: (id) => set({ アクティブタイムラインid: id }),

  現在週を設定する: (週) => set({ 現在週: 週 }),

  表示開始月を設定する: (年, 月) => set({
    表示開始年: 年,
    表示開始月: 月,
    開始週インデックス: 月週を週インデックスに変換する(年, 月, 0),
  }),

  タイムラインを作成する: async (名前) => {
    const 新tl = await api<{ id: string }>("", {
      method: "POST",
      body: JSON.stringify({ 名前 }),
    });
    const 詳細 = await api<タイムライン>(`/${新tl.id}`);
    set((状態) => ({
      タイムライン一覧: [...状態.タイムライン一覧, 詳細],
      アクティブタイムラインid: 詳細.id,
    }));
    return 詳細.id;
  },

  スケジュールを追加する: async (タイムラインid, 野菜id) => {
    // 楽観的更新
    const 仮id = crypto.randomUUID();
    set((状態) => ({
      タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
        ...tl,
        最終編集日時: new Date().toISOString(),
        スケジュール一覧: [...tl.スケジュール一覧, { id: 仮id, 野菜id, イベント一覧: [] }],
      })),
    }));

    try {
      const 結果 = await api<スケジュール>(`/${タイムラインid}/schedules`, {
        method: "POST",
        body: JSON.stringify({ 野菜id }),
      });
      // 仮idをサーバーのidに差し替え
      set((状態) => ({
        タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
          ...tl,
          スケジュール一覧: tl.スケジュール一覧.map((s) =>
            s.id === 仮id ? { ...s, id: 結果.id } : s
          ),
        })),
      }));
    } catch {
      // ロールバック
      set((状態) => ({
        タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
          ...tl,
          スケジュール一覧: tl.スケジュール一覧.filter((s) => s.id !== 仮id),
        })),
      }));
    }
  },

  スケジュールを削除する: async (タイムラインid, スケジュールid) => {
    // 楽観的更新
    const tl = get().タイムライン一覧.find((t) => t.id === タイムラインid);
    const 削除対象 = tl?.スケジュール一覧.find((s) => s.id === スケジュールid);

    set((状態) => ({
      タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
        ...tl,
        最終編集日時: new Date().toISOString(),
        スケジュール一覧: tl.スケジュール一覧.filter((s) => s.id !== スケジュールid),
      })),
    }));

    try {
      await api(`/${タイムラインid}/schedules/${スケジュールid}`, { method: "DELETE" });
    } catch {
      // ロールバック
      if (削除対象) {
        set((状態) => ({
          タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
            ...tl,
            スケジュール一覧: [...tl.スケジュール一覧, 削除対象],
          })),
        }));
      }
    }
  },

  イベントを追加する: async (タイムラインid, スケジュールid, 新イベント) => {
    const 仮id = crypto.randomUUID();

    set((状態) => ({
      タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
        ...tl,
        最終編集日時: new Date().toISOString(),
        スケジュール一覧: tl.スケジュール一覧.map((s) =>
          s.id === スケジュールid
            ? { ...s, イベント一覧: [...s.イベント一覧, { ...新イベント, id: 仮id }] }
            : s
        ),
      })),
    }));

    try {
      const 結果 = await api<イベント>(`/${タイムラインid}/schedules/${スケジュールid}/events`, {
        method: "POST",
        body: JSON.stringify(新イベント),
      });
      set((状態) => ({
        タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
          ...tl,
          スケジュール一覧: tl.スケジュール一覧.map((s) =>
            s.id === スケジュールid
              ? { ...s, イベント一覧: s.イベント一覧.map((e) => e.id === 仮id ? { ...e, id: 結果.id } : e) }
              : s
          ),
        })),
      }));
    } catch {
      set((状態) => ({
        タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
          ...tl,
          スケジュール一覧: tl.スケジュール一覧.map((s) =>
            s.id === スケジュールid
              ? { ...s, イベント一覧: s.イベント一覧.filter((e) => e.id !== 仮id) }
              : s
          ),
        })),
      }));
    }
  },

  イベントを削除する: async (タイムラインid, スケジュールid, イベントid) => {
    const tl = get().タイムライン一覧.find((t) => t.id === タイムラインid);
    const スケジュール = tl?.スケジュール一覧.find((s) => s.id === スケジュールid);
    const 削除対象 = スケジュール?.イベント一覧.find((e) => e.id === イベントid);

    set((状態) => ({
      タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
        ...tl,
        最終編集日時: new Date().toISOString(),
        スケジュール一覧: tl.スケジュール一覧.map((s) =>
          s.id === スケジュールid
            ? { ...s, イベント一覧: s.イベント一覧.filter((e) => e.id !== イベントid) }
            : s
        ),
      })),
    }));

    try {
      await api(`/${タイムラインid}/schedules/${スケジュールid}/events/${イベントid}`, { method: "DELETE" });
    } catch {
      if (削除対象) {
        set((状態) => ({
          タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
            ...tl,
            スケジュール一覧: tl.スケジュール一覧.map((s) =>
              s.id === スケジュールid
                ? { ...s, イベント一覧: [...s.イベント一覧, 削除対象] }
                : s
            ),
          })),
        }));
      }
    }
  },

  イベントを更新する: async (タイムラインid, スケジュールid, イベントid, 更新) => {
    const tl = get().タイムライン一覧.find((t) => t.id === タイムラインid);
    const スケジュール = tl?.スケジュール一覧.find((s) => s.id === スケジュールid);
    const 元イベント = スケジュール?.イベント一覧.find((e) => e.id === イベントid);

    set((状態) => ({
      タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
        ...tl,
        最終編集日時: new Date().toISOString(),
        スケジュール一覧: tl.スケジュール一覧.map((s) =>
          s.id === スケジュールid
            ? { ...s, イベント一覧: s.イベント一覧.map((e) => e.id === イベントid ? { ...e, ...更新 } : e) }
            : s
        ),
      })),
    }));

    try {
      await api(`/${タイムラインid}/schedules/${スケジュールid}/events/${イベントid}`, {
        method: "PUT",
        body: JSON.stringify(更新),
      });
    } catch {
      if (元イベント) {
        set((状態) => ({
          タイムライン一覧: タイムラインを差し替える(状態.タイムライン一覧, タイムラインid, (tl) => ({
            ...tl,
            スケジュール一覧: tl.スケジュール一覧.map((s) =>
              s.id === スケジュールid
                ? { ...s, イベント一覧: s.イベント一覧.map((e) => e.id === イベントid ? 元イベント : e) }
                : s
            ),
          })),
        }));
      }
    }
  },
}));
