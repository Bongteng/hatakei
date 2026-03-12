import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { 畝 } from "../types";
import { ローカルストレージから読む, 畝一覧を保存する } from "./ローカルストレージ";

type マップストア = {
  畝一覧: 畝[];
  畝を追加する: (畝: Omit<畝, "id">) => void;
  畝を更新する: (id: string, 差分: Partial<畝>) => void;
  畝を削除する: (id: string) => void;
};

const 初期データ = ローカルストレージから読む();

const idを生成する = () => crypto.randomUUID();

export const マップストアを使う = create<マップストア>()(
  subscribeWithSelector((set, get) => ({
    畝一覧: 初期データ.畝一覧,

    畝を追加する: (新しい畝) => {
      const 畝: 畝 = { ...新しい畝, id: idを生成する() };
      set((状態) => ({ 畝一覧: [...状態.畝一覧, 畝] }));
      畝一覧を保存する(get().畝一覧);
    },

    畝を更新する: (id, 差分) => {
      set((状態) => ({
        畝一覧: 状態.畝一覧.map((畝) =>
          畝.id === id ? { ...畝, ...差分 } : 畝
        ),
      }));
      畝一覧を保存する(get().畝一覧);
    },

    畝を削除する: (id) => {
      set((状態) => ({
        畝一覧: 状態.畝一覧.filter((畝) => 畝.id !== id),
      }));
      畝一覧を保存する(get().畝一覧);
    },
  }))
);
