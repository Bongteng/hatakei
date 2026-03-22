import { create } from "zustand";
import type { テンプレート応答 } from "../types";

type テンプレートストア = {
  テンプレート一覧: テンプレート応答[];
  読み込み中: boolean;
  検索キーワード: string;
  検索タグ: string;
  ソート: "likes" | "newest";

  テンプレートを取得する: () => Promise<void>;
  検索キーワードを設定する: (キーワード: string) => void;
  検索タグを設定する: (タグ: string) => void;
  ソートを設定する: (ソート: "likes" | "newest") => void;
  いいねを切り替える: (テンプレートid: string) => Promise<void>;
};

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const テンプレートストアを使う = create<テンプレートストア>()((set, get) => ({
  テンプレート一覧: [],
  読み込み中: false,
  検索キーワード: "",
  検索タグ: "",
  ソート: "likes" as const,

  テンプレートを取得する: async () => {
    const { 検索キーワード, 検索タグ, ソート } = get();
    set({ 読み込み中: true });
    try {
      const パラメータ = new URLSearchParams();
      if (検索キーワード) パラメータ.set("q", 検索キーワード);
      if (検索タグ) パラメータ.set("tag", 検索タグ);
      パラメータ.set("sort", ソート);

      const レスポンス = await fetch(
        `${APIのベースURL}/api/templates?${パラメータ.toString()}`,
        { credentials: "include" }
      );
      const データ = (await レスポンス.json()) as テンプレート応答[];
      set({ テンプレート一覧: データ });
    } catch {
      set({ テンプレート一覧: [] });
    } finally {
      set({ 読み込み中: false });
    }
  },

  検索キーワードを設定する: (キーワード) => set({ 検索キーワード: キーワード }),
  検索タグを設定する: (タグ) => set({ 検索タグ: タグ }),
  ソートを設定する: (ソート) => set({ ソート }),

  いいねを切り替える: async (テンプレートid) => {
    const テンプレート = get().テンプレート一覧.find((t) => t.id === テンプレートid);
    if (!テンプレート) return;

    const メソッド = テンプレート.いいね済み ? "DELETE" : "POST";
    try {
      await fetch(`${APIのベースURL}/api/templates/${テンプレートid}/likes`, {
        method: メソッド,
        credentials: "include",
      });

      set({
        テンプレート一覧: get().テンプレート一覧.map((t) =>
          t.id === テンプレートid
            ? {
                ...t,
                いいね済み: !t.いいね済み,
                いいね数: t.いいね済み ? t.いいね数 - 1 : t.いいね数 + 1,
              }
            : t
        ),
      });
    } catch {
      // いいね失敗は無視
    }
  },
}));
