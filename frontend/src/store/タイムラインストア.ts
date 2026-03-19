import { create } from "zustand";
import type { タイムライン, イベント, 週インデックス } from "../types";

type タイムラインストア = {
  タイムライン一覧: タイムライン[];
  アクティブタイムラインid: string | null;
  現在週: 週インデックス;
  読み込み中: boolean;

  アクティブタイムラインidを設定する: (id: string) => void;
  現在週を設定する: (週: 週インデックス) => void;
  タイムラインを作成する: (名前: string) => string;
  スケジュールを追加する: (タイムラインid: string, 野菜id: string) => void;
  スケジュールを削除する: (タイムラインid: string, スケジュールid: string) => void;
  イベントを追加する: (タイムラインid: string, スケジュールid: string, イベント: Omit<イベント, "id">) => void;
  イベントを削除する: (タイムラインid: string, スケジュールid: string, イベントid: string) => void;
  イベントを更新する: (タイムラインid: string, スケジュールid: string, イベントid: string, 更新: Partial<Omit<イベント, "id">>) => void;
};

const 今日の週インデックスを求める = (): 週インデックス => {
  const 今日 = new Date();
  const 月 = 今日.getMonth() + 1;
  const 日 = 今日.getDate();
  const 週番号 = Math.floor((日 - 1) / 7);

  const 月別開始インデックス: Record<number, number> = {
    3: 0, 4: 4, 5: 9, 6: 13, 7: 17, 8: 22,
    9: 26, 10: 30, 11: 35, 12: 39, 1: 43, 2: 48,
  };
  return (月別開始インデックス[月] ?? 0) + 週番号;
};

const デフォルトタイムラインid = crypto.randomUUID();

export const タイムラインストアを使う = create<タイムラインストア>()((set) => ({
  タイムライン一覧: [
    {
      id: デフォルトタイムラインid,
      名前: "マイタイムライン",
      スケジュール一覧: [],
      所有者id: null,
      作成日時: new Date().toISOString(),
      最終編集日時: new Date().toISOString(),
    },
  ],
  アクティブタイムラインid: デフォルトタイムラインid,
  現在週: 今日の週インデックスを求める(),
  読み込み中: false,

  アクティブタイムラインidを設定する: (id) => set({ アクティブタイムラインid: id }),

  現在週を設定する: (週) => set({ 現在週: 週 }),

  タイムラインを作成する: (名前) => {
    const id = crypto.randomUUID();
    set((状態) => ({
      タイムライン一覧: [
        ...状態.タイムライン一覧,
        {
          id,
          名前,
          スケジュール一覧: [],
          所有者id: null,
          作成日時: new Date().toISOString(),
          最終編集日時: new Date().toISOString(),
        },
      ],
      アクティブタイムラインid: id,
    }));
    return id;
  },

  スケジュールを追加する: (タイムラインid, 野菜id) => {
    const スケジュールid = crypto.randomUUID();
    set((状態) => ({
      タイムライン一覧: 状態.タイムライン一覧.map((tl) =>
        tl.id === タイムラインid
          ? {
              ...tl,
              最終編集日時: new Date().toISOString(),
              スケジュール一覧: [
                ...tl.スケジュール一覧,
                { id: スケジュールid, 野菜id, イベント一覧: [] },
              ],
            }
          : tl
      ),
    }));
  },

  スケジュールを削除する: (タイムラインid, スケジュールid) => {
    set((状態) => ({
      タイムライン一覧: 状態.タイムライン一覧.map((tl) =>
        tl.id === タイムラインid
          ? {
              ...tl,
              最終編集日時: new Date().toISOString(),
              スケジュール一覧: tl.スケジュール一覧.filter(
                (s) => s.id !== スケジュールid
              ),
            }
          : tl
      ),
    }));
  },

  イベントを追加する: (タイムラインid, スケジュールid, 新イベント) => {
    const イベントid = crypto.randomUUID();
    set((状態) => ({
      タイムライン一覧: 状態.タイムライン一覧.map((tl) =>
        tl.id === タイムラインid
          ? {
              ...tl,
              最終編集日時: new Date().toISOString(),
              スケジュール一覧: tl.スケジュール一覧.map((s) =>
                s.id === スケジュールid
                  ? {
                      ...s,
                      イベント一覧: [
                        ...s.イベント一覧,
                        { ...新イベント, id: イベントid },
                      ],
                    }
                  : s
              ),
            }
          : tl
      ),
    }));
  },

  イベントを削除する: (タイムラインid, スケジュールid, イベントid) => {
    set((状態) => ({
      タイムライン一覧: 状態.タイムライン一覧.map((tl) =>
        tl.id === タイムラインid
          ? {
              ...tl,
              最終編集日時: new Date().toISOString(),
              スケジュール一覧: tl.スケジュール一覧.map((s) =>
                s.id === スケジュールid
                  ? {
                      ...s,
                      イベント一覧: s.イベント一覧.filter(
                        (e) => e.id !== イベントid
                      ),
                    }
                  : s
              ),
            }
          : tl
      ),
    }));
  },

  イベントを更新する: (タイムラインid, スケジュールid, イベントid, 更新) => {
    set((状態) => ({
      タイムライン一覧: 状態.タイムライン一覧.map((tl) =>
        tl.id === タイムラインid
          ? {
              ...tl,
              最終編集日時: new Date().toISOString(),
              スケジュール一覧: tl.スケジュール一覧.map((s) =>
                s.id === スケジュールid
                  ? {
                      ...s,
                      イベント一覧: s.イベント一覧.map((e) =>
                        e.id === イベントid ? { ...e, ...更新 } : e
                      ),
                    }
                  : s
              ),
            }
          : tl
      ),
    }));
  },
}));
