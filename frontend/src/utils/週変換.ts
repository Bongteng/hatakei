// 週インデックス（1月起点 1-based: 1 = 1月第1週, 52 = 12月最終週）
// 3年分: 2026年1月〜2028年12月（週インデックス 1〜156）
// 表示列: 0-based（0 = 1月第1週）

// 1月起点の月順
const 月順 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

// 各月の週数
const 月別週数: Record<number, number> = {
  1: 5, 2: 4, 3: 4, 4: 5, 5: 4, 6: 4,
  7: 5, 8: 4, 9: 4, 10: 5, 11: 4, 12: 4,
};

export const 列幅 = 40;
export const 年数 = 3;
export const 週数合計 = 52 * 年数; // 156

// 週インデックス（1-based）→ 表示列（0-based）
export const 週インデックスを表示列に変換する = (週インデックス: number): number => {
  return 週インデックス - 1;
};

// 表示列（0-based）→ 週インデックス（1-based）
export const 表示列を週インデックスに変換する = (表示列: number): number => {
  return 表示列 + 1;
};

export type 月ヘッダー = {
  ラベル: string;
  開始列: number;
  列数: number;
};

export const 月ヘッダー一覧を生成する = (): 月ヘッダー[] => {
  const 結果: 月ヘッダー[] = [];
  const 開始年 = 2026;

  for (let 年オフセット = 0; 年オフセット < 年数; 年オフセット++) {
    let 年内列 = 0;
    for (const 月 of 月順) {
      const 列数 = 月別週数[月];
      結果.push({
        ラベル: `${開始年 + 年オフセット}/${月}月`,
        開始列: 年オフセット * 52 + 年内列,
        列数,
      });
      年内列 += 列数;
    }
  }

  return 結果;
};

// クリック位置のX座標から表示列を算出
export const X座標を表示列に変換する = (x: number): number => {
  return Math.floor(x / 列幅);
};
