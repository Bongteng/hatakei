import { create } from "zustand";
import type { タイムライン, 週インデックス } from "../types";

type タイムラインストア = {
  タイムライン一覧: タイムライン[];
  現在週: 週インデックス;
  読み込み中: boolean;
  現在週を設定する: (週: 週インデックス) => void;
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

export const タイムラインストアを使う = create<タイムラインストア>()((set) => ({
  タイムライン一覧: [],
  現在週: 今日の週インデックスを求める(),
  読み込み中: false,

  現在週を設定する: (週) => set({ 現在週: 週 }),
}));
