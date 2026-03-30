export const テーブル作成SQL = `
CREATE TABLE IF NOT EXISTS ユーザー (
  id              TEXT PRIMARY KEY,
  表示名          TEXT NOT NULL,
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS 野菜 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  名称            TEXT NOT NULL,
  色              TEXT NOT NULL,
  カスタム        BOOLEAN DEFAULT FALSE,
  作成者id        TEXT REFERENCES ユーザー(id),
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS タイムライン (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  名前            TEXT NOT NULL DEFAULT '無題のタイムライン',
  所有者id        TEXT REFERENCES ユーザー(id),
  匿名Cookie     TEXT,
  作成日時        TIMESTAMPTZ DEFAULT NOW(),
  最終編集日時    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS スケジュール (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  タイムラインid  UUID NOT NULL REFERENCES タイムライン(id) ON DELETE CASCADE,
  野菜id          UUID NOT NULL REFERENCES 野菜(id),
  表示順          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS イベント (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  スケジュールid  UUID NOT NULL REFERENCES スケジュール(id) ON DELETE CASCADE,
  イベント名      TEXT NOT NULL,
  開始週          SMALLINT NOT NULL,
  終了週          SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS スケジュールテンプレート (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  テンプレート名  TEXT NOT NULL,
  説明文          TEXT DEFAULT '',
  野菜id          UUID NOT NULL REFERENCES 野菜(id),
  作成者id        TEXT NOT NULL REFERENCES ユーザー(id),
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS テンプレートイベント (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  テンプレートid  UUID NOT NULL REFERENCES スケジュールテンプレート(id) ON DELETE CASCADE,
  イベント名      TEXT NOT NULL,
  開始週          SMALLINT NOT NULL,
  終了週          SMALLINT NOT NULL,
  出典            TEXT
);

CREATE TABLE IF NOT EXISTS テンプレートタグ (
  テンプレートid  UUID NOT NULL REFERENCES スケジュールテンプレート(id) ON DELETE CASCADE,
  タグ            TEXT NOT NULL,
  PRIMARY KEY (テンプレートid, タグ)
);

CREATE TABLE IF NOT EXISTS テンプレートいいね (
  テンプレートid  UUID NOT NULL REFERENCES スケジュールテンプレート(id) ON DELETE CASCADE,
  ユーザーid      TEXT NOT NULL REFERENCES ユーザー(id),
  PRIMARY KEY (テンプレートid, ユーザーid)
);

CREATE TABLE IF NOT EXISTS テンプレート通報 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  テンプレートid  UUID NOT NULL REFERENCES スケジュールテンプレート(id) ON DELETE CASCADE,
  通報者id        TEXT NOT NULL REFERENCES ユーザー(id),
  理由            TEXT,
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS 共有リンク (
  id              TEXT PRIMARY KEY,
  タイムラインid  UUID NOT NULL REFERENCES タイムライン(id) ON DELETE CASCADE,
  発行者Cookie    TEXT NOT NULL,
  発行者id        TEXT REFERENCES ユーザー(id),
  有効期限        TIMESTAMPTZ NOT NULL,
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE テンプレートイベント ADD COLUMN IF NOT EXISTS 出典 TEXT;
ALTER TABLE イベント ADD COLUMN IF NOT EXISTS コメント TEXT;
ALTER TABLE ユーザー ADD COLUMN IF NOT EXISTS アクセストークン TEXT;
ALTER TABLE ユーザー ADD COLUMN IF NOT EXISTS リフレッシュトークン TEXT;

CREATE INDEX IF NOT EXISTS idx_スケジュール_タイムライン ON スケジュール(タイムラインid);
CREATE INDEX IF NOT EXISTS idx_イベント_スケジュール ON イベント(スケジュールid);
CREATE INDEX IF NOT EXISTS idx_テンプレートイベント_テンプレート ON テンプレートイベント(テンプレートid);
CREATE INDEX IF NOT EXISTS idx_テンプレートいいね_テンプレート ON テンプレートいいね(テンプレートid);
CREATE INDEX IF NOT EXISTS idx_共有リンク_タイムライン ON 共有リンク(タイムラインid);
CREATE INDEX IF NOT EXISTS idx_共有リンク_有効期限 ON 共有リンク(有効期限);
CREATE INDEX IF NOT EXISTS idx_タイムライン_匿名Cookie ON タイムライン(匿名Cookie);
`;
