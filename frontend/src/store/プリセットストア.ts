import { create } from "zustand";
import type { 野菜 } from "../types";
import { ローカルストレージから読む, カスタム野菜一覧を保存する } from "./ローカルストレージ";

type プリセットストア = {
  野菜一覧: 野菜[];
  カスタム野菜一覧: 野菜[];
  読み込み中: boolean;
  野菜を取得する: () => Promise<void>;
  カスタム野菜を追加する: (野菜: Omit<野菜, "id">) => void;
  カスタム野菜を更新する: (id: string, 差分: Partial<野菜>) => void;
  カスタム野菜を削除する: (id: string) => void;
};

const 初期データ = ローカルストレージから読む();

const idを生成する = () => crypto.randomUUID();

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const プリセットストアを使う = create<プリセットストア>()((set, get) => ({
  野菜一覧: [],
  カスタム野菜一覧: 初期データ.カスタム野菜一覧,
  読み込み中: false,

  野菜を取得する: async () => {
    set({ 読み込み中: true });
    try {
      const レスポンス = await fetch(`${APIのベースURL}/api/野菜`);
      const データ = await レスポンス.json() as 野菜[];
      set({ 野菜一覧: データ });
    } catch {
      // APIエラー時はフォールバック（空のまま）
      set({ 野菜一覧: [] });
    } finally {
      set({ 読み込み中: false });
    }
  },

  カスタム野菜を追加する: (新しい野菜) => {
    const 野菜: 野菜 = { ...新しい野菜, id: idを生成する() };
    set((状態) => ({ カスタム野菜一覧: [...状態.カスタム野菜一覧, 野菜] }));
    カスタム野菜一覧を保存する(get().カスタム野菜一覧);
  },

  カスタム野菜を更新する: (id, 差分) => {
    set((状態) => ({
      カスタム野菜一覧: 状態.カスタム野菜一覧.map((野菜) =>
        野菜.id === id ? { ...野菜, ...差分 } : 野菜
      ),
    }));
    カスタム野菜一覧を保存する(get().カスタム野菜一覧);
  },

  カスタム野菜を削除する: (id) => {
    set((状態) => ({
      カスタム野菜一覧: 状態.カスタム野菜一覧.filter((野菜) => 野菜.id !== id),
    }));
    カスタム野菜一覧を保存する(get().カスタム野菜一覧);
  },
}));
