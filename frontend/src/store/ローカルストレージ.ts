import type { ローカルストレージスキーマ, 畝, 栽培ブロック, 野菜 } from "../types";

const ストレージキー = "hatakei_v1";

const 初期値: ローカルストレージスキーマ = {
  バージョン: 1,
  畝一覧: [],
  栽培ブロック一覧: [],
  カスタム野菜一覧: [],
  最終保存日時: new Date().toISOString(),
};

export const ローカルストレージから読む = (): ローカルストレージスキーマ => {
  try {
    const 生データ = localStorage.getItem(ストレージキー);
    if (!生データ) return 初期値;
    const データ = JSON.parse(生データ) as ローカルストレージスキーマ;
    if (データ.バージョン !== 1) return 初期値;
    return データ;
  } catch {
    return 初期値;
  }
};

export const 畝一覧を保存する = (畝一覧: 畝[]): void => {
  const 現在 = ローカルストレージから読む();
  const 保存データ: ローカルストレージスキーマ = {
    ...現在,
    畝一覧,
    最終保存日時: new Date().toISOString(),
  };
  localStorage.setItem(ストレージキー, JSON.stringify(保存データ));
};

export const 栽培ブロック一覧を保存する = (栽培ブロック一覧: 栽培ブロック[]): void => {
  const 現在 = ローカルストレージから読む();
  const 保存データ: ローカルストレージスキーマ = {
    ...現在,
    栽培ブロック一覧,
    最終保存日時: new Date().toISOString(),
  };
  localStorage.setItem(ストレージキー, JSON.stringify(保存データ));
};

export const カスタム野菜一覧を保存する = (カスタム野菜一覧: 野菜[]): void => {
  const 現在 = ローカルストレージから読む();
  const 保存データ: ローカルストレージスキーマ = {
    ...現在,
    カスタム野菜一覧,
    最終保存日時: new Date().toISOString(),
  };
  localStorage.setItem(ストレージキー, JSON.stringify(保存データ));
};
