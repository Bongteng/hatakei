import { create } from "zustand";
import type { 野菜 } from "../types";

type プリセットストア = {
  野菜一覧: 野菜[];
  読み込み中: boolean;
  野菜を取得する: () => Promise<void>;
  カスタム野菜を追加する: (名称: string, 色: string) => string;
  野菜を更新する: (id: string, 更新: { 名称?: string; 色?: string }) => Promise<void>;
};

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const プリセットストアを使う = create<プリセットストア>()((set) => ({
  野菜一覧: [],
  読み込み中: false,

  野菜を取得する: async () => {
    set({ 読み込み中: true });
    try {
      const レスポンス = await fetch(`${APIのベースURL}/api/vegetables`, {
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

  カスタム野菜を追加する: (名称, 色) => {
    const id = crypto.randomUUID();
    set((状態) => ({
      野菜一覧: [...状態.野菜一覧, { id, 名称, 色, カスタム: true }],
    }));
    return id;
  },

  野菜を更新する: async (id, 更新) => {
    // 楽観的更新
    set((状態) => ({
      野菜一覧: 状態.野菜一覧.map((v) => v.id === id ? { ...v, ...更新 } : v),
    }));
    try {
      await fetch(`${APIのベースURL}/api/vegetables/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(更新),
      });
    } catch {
      // 失敗時は再取得
      const レスポンス = await fetch(`${APIのベースURL}/api/vegetables`, { credentials: "include" });
      const データ = await レスポンス.json() as 野菜[];
      set({ 野菜一覧: データ });
    }
  },
}));
