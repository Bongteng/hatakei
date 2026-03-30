// 週番号 (0 = 3月第1週, 51 = 2月最終週)
export type 週インデックス = number;

// 野菜
export type 野菜 = {
  id: string;
  名称: string;
  色: string;
  カスタム: boolean;
};

// イベント
export type イベント = {
  id: string;
  イベント名: string;
  開始週: 週インデックス;
  終了週: 週インデックス;
  コメント?: string | null;
};

// スケジュール（タイムラインの1行）
export type スケジュール = {
  id: string;
  野菜id: string;
  イベント一覧: イベント[];
};

// タイムライン
export type タイムライン = {
  id: string;
  名前: string;
  スケジュール一覧: スケジュール[];
  所有者id: string | null;
  作成日時: string;
  最終編集日時: string;
};

// スケジュールテンプレート
export type スケジュールテンプレート = {
  id: string;
  テンプレート名: string;
  説明文: string;
  野菜id: string;
  イベント一覧: イベント[];
  タグ一覧: string[];
  いいね数: number;
  作成者id: string;
  作成日時: string;
};

// ユーザー
export type ユーザー = {
  id: string;
  表示名: string;
};

// URL共有
export type 共有リンク = {
  id: string;
  タイムラインid: string;
  発行者Cookie: string;
  発行者id: string | null;
  有効期限: string;
  作成日時: string;
};

// テンプレートAPI応答
export type テンプレート応答 = {
  id: string;
  テンプレート名: string;
  説明文: string;
  野菜id: string;
  作成者id: string;
  作成日時: string;
  野菜名称: string;
  野菜色: string;
  いいね数: number;
  イベント一覧: イベント[];
  タグ一覧: string[];
  いいね済み: boolean;
};

// 定義済みイベント名
export type 定義済みイベント名 =
  | "種まき"
  | "育苗"
  | "定植"
  | "追肥"
  | "収穫"
  | "土づくり"
  | "剪定"
  | "支柱立て";
