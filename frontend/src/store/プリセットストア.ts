import { create } from "zustand";
import type { 野菜 } from "../types";

type プリセットストア = {
  野菜一覧: 野菜[];
  読み込み中: boolean;
  野菜を取得する: () => Promise<void>;
};

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const プリセットストアを使う = create<プリセットストア>()((set) => ({
  野菜一覧: [],
  読み込み中: false,

  野菜を取得する: async () => {
    set({ 読み込み中: true });
    try {
      const レスポンス = await fetch(`${APIのベースURL}/api/野菜`, {
        credentials: "include",
      });
      const データ = await レスポンス.json() as 野菜[];
      set({ 野菜一覧: データ });
    } catch {
      set({ 野菜一覧: [] });
    } finally {
      set({ 読み込み中: false });
    }
  },
}));
