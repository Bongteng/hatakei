// 週インデックス: 1月起点 1-based（1 = 2026年1月第1週）
// 表示行: 0-based（開始週インデックスからの相対位置）

export const 基準年 = 2026;
export const 週数合計 = 52; // 1年分

// レイアウト定数
export const 行高さ = 28;           // 各週行の高さ(px)
export const スケジュール列幅 = 120; // 各スケジュール列の固定幅(px)
export const 週ラベル列幅 = 76;      // 左端の週ラベル列幅(px)

export const 月別週数: Record<number, number> = {
  1: 5, 2: 4, 3: 4, 4: 5, 5: 4, 6: 4,
  7: 5, 8: 4, 9: 4, 10: 5, 11: 4, 12: 4,
};

// 月別開始インデックス（1月起点 1-based, 年内）
export const 月別開始インデックス: Record<number, number> = {
  1: 1, 2: 6, 3: 10, 4: 14, 5: 19, 6: 23,
  7: 27, 8: 32, 9: 36, 10: 40, 11: 45, 12: 49,
};

// 年・月・週番号(0-based) → 週インデックス（絶対値 1-based）
export const 月週を週インデックスに変換する = (年: number, 月: number, 週番号: number): number => {
  return (年 - 基準年) * 52 + (月別開始インデックス[月] ?? 1) + 週番号;
};

// 週インデックス(1-based絶対値) → {年, 月, 週番号(0-based)}
export const 週インデックスを月週に変換する = (週インデックス: number): { 年: number; 月: number; 週番号: number } => {
  const 年オフセット = Math.floor((週インデックス - 1) / 52);
  const 年内インデックス = ((週インデックス - 1) % 52) + 1;

  let 見つかった月 = 12;
  for (const m of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const) {
    const 開始 = 月別開始インデックス[m] ?? 1;
    const 次の開始 = m < 12 ? (月別開始インデックス[m + 1] ?? 53) : 53;
    if (年内インデックス >= 開始 && 年内インデックス < 次の開始) {
      見つかった月 = m;
      break;
    }
  }

  return {
    年: 基準年 + 年オフセット,
    月: 見つかった月,
    週番号: 年内インデックス - (月別開始インデックス[見つかった月] ?? 1),
  };
};

// 週インデックス → "2026年3月第1週"
export const 週インデックスを月週表示に変換する = (週インデックス: number): string => {
  const { 年, 月, 週番号 } = 週インデックスを月週に変換する(週インデックス);
  return `${年}年${月}月第${週番号 + 1}週`;
};

// 週インデックス(1-based) → 表示行(0-based, 開始週からの相対位置)
export const 週インデックスを表示行に変換する = (週インデックス: number, 開始週インデックス: number): number => {
  return 週インデックス - 開始週インデックス;
};

// 表示行(0-based) → 週インデックス(1-based)
export const 表示行を週インデックスに変換する = (表示行: number, 開始週インデックス: number): number => {
  return 表示行 + 開始週インデックス;
};

// Y座標(px) → 表示行(0-based)
export const Y座標を表示行に変換する = (y: number): number => {
  return Math.floor(y / 行高さ);
};

export type 月ヘッダー = {
  ラベル: string;
  開始行: number;
  行数: number;
};

// 開始年・月から12ヶ月分のヘッダーを生成
export const 月ヘッダー一覧を生成する = (開始年: number, 開始月: number): 月ヘッダー[] => {
  const 結果: 月ヘッダー[] = [];
  let 現在行 = 0;
  let 年 = 開始年;
  let 月 = 開始月;

  for (let i = 0; i < 12; i++) {
    const 行数 = 月別週数[月] ?? 4;
    結果.push({ ラベル: `${年}/${月}月`, 開始行: 現在行, 行数 });
    現在行 += 行数;
    月++;
    if (月 > 12) { 月 = 1; 年++; }
  }

  return 結果;
};
