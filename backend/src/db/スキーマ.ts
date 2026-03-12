export const テーブル作成SQL = `
CREATE TABLE IF NOT EXISTS 野菜 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  名前             TEXT NOT NULL,
  アイコンURL      TEXT NOT NULL DEFAULT '',
  色               TEXT NOT NULL,
  カテゴリ         TEXT NOT NULL,
  種まき開始週     SMALLINT NOT NULL,
  種まき終了週     SMALLINT NOT NULL,
  収穫開始週       SMALLINT NOT NULL,
  収穫終了週       SMALLINT NOT NULL,
  標準栽培週数     SMALLINT NOT NULL,
  作成日時         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
