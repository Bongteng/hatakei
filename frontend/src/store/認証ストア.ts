import { create } from "zustand";
import type { ユーザー } from "../types";

type 認証ストア = {
  ユーザー: ユーザー | null;
  読み込み中: boolean;
  自分を取得する: () => Promise<void>;
  ログアウトする: () => Promise<void>;
};

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const 認証ストアを使う = create<認証ストア>()((set) => ({
  ユーザー: null,
  読み込み中: false,

  自分を取得する: async () => {
    set({ 読み込み中: true });
    try {
      const レスポンス = await fetch(`${APIのベースURL}/api/auth/me`, {
        credentials: "include",
      });
      const データ = await レスポンス.json() as { ユーザー: ユーザー | null };
      set({ ユーザー: データ.ユーザー });
    } catch {
      set({ ユーザー: null });
    } finally {
      set({ 読み込み中: false });
    }
  },

  ログアウトする: async () => {
    try {
      await fetch(`${APIのベースURL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      set({ ユーザー: null });
    }
  },
}));
