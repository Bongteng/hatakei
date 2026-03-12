// 方向
export type 方向 = "横" | "縦";

// 週番号 (0 = 3月第1週, 51 = 2月最終週)
export type 週インデックス = number;

// 畝
export type 畝 = {
  id: string;
  名前: string;
  x: number;    // グリッド列（0-59）
  y: number;    // グリッド行（0-59）
  長さ: number; // マス数（n）
  方向: 方向;
};

// 野菜プリセット
export type 野菜 = {
  id: string;
  名前: string;
  アイコンURL: string;
  色: string;             // タイムラインブロックの背景色（hex）
  カテゴリ: string;
  種まき開始週: 週インデックス;
  種まき終了週: 週インデックス;
  収穫開始週: 週インデックス;
  収穫終了週: 週インデックス;
  標準栽培週数: number;
};

// 栽培ブロック（タイムライン上の配置）
export type 栽培ブロック = {
  id: string;
  畝id: string;
  野菜id: string;
  開始週: 週インデックス;
  終了週: 週インデックス;
};

// ローカルストレージスキーマ
export type ローカルストレージスキーマ = {
  バージョン: 1;
  畝一覧: 畝[];
  栽培ブロック一覧: 栽培ブロック[];
  カスタム野菜一覧: 野菜[];
  最終保存日時: string;
};
