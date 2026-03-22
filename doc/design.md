# 要件・設計書

## 1. 要件定義

### 1.1 基本情報
- ソフトウェア名称: hatakei（はたけい）
- リポジトリ名: hatakei

### 1.2 プロジェクト概要

家庭菜園の栽培スケジュールを管理するWebアプリ。
画面全体にガントチャート形式のタイムラインを表示し、野菜ごとの栽培イベント（種まき・定植・収穫等）を視覚的に管理する。
テンプレート機能により、他ユーザーのスケジュールを参考にできる。

### 1.3 機能要件

#### 1.3.1 タイムライン機能
- 画面全体にガントチャート形式で表示
- 縦軸: 野菜の種類（スケジュール行）
- 横軸: 時期（週単位、今年1月〜2年後12月末の3年間）
- スケジュール行の表示:
  - 野菜ごとに色が決まる（背景色）
  - イベントは半透明の白バーで表示
  - 同一行内でイベントが重なる場合は1行内に重ねて表示
- スケジュール行の操作:
  - イベントの追加・削除
  - イベントの期間変更（ドラッグ対応）
  - 行の並べ替え（ドラッグ対応）
- 1ユーザー複数タイムライン可

#### 1.3.2 スケジュール・イベント
- スケジュール = {野菜, イベントlist}
  - 開始週・終了週はイベントのmin/maxから算出（フィールドとして持たない）
- イベント = {イベント名, 開始週, 終了週}
  - イベント名: 定義済み（種まき、定植、収穫、追肥 等）+ 自由入力
- 週インデックス = 0〜51（3月第1週起点）

#### 1.3.3 テンプレート機能
- タイムライン上の行を「スケジュールテンプレート」としてDB登録可能
- テンプレート = {野菜, イベントlist, いいねユーザlist, タグlist, 説明文, 作成者, テンプレート名}
- テンプレート名: 野菜名とは別に独自の名前をつけられる（例: 「夏トマト（早植え）」）
- 全ユーザーに公開
- 作成者のみ編集・削除可能
- テンプレートをタイムラインに追加 → 編集 → 別テンプレートとして公開可能
- タイムラインに追加されたデータはコピー（テンプレート削除の影響なし）

#### 1.3.4 テンプレート一覧・検索
- いいね数順でソート
- タグ・野菜名・開始時期による検索
- いいね（取り消し可能）
- タグ: 自由入力
- 通報機能

#### 1.3.5 プラスボタン
- 画面右下に配置
- 押すとスケジュールテンプレート一覧が表示される
- テンプレートを選択するとタイムラインに追加される

#### 1.3.6 野菜マスタ
- プリセット野菜（33種）+ ユーザーカスタム野菜
- 野菜 = {名称}（アイコン画像はひとまずなし）

#### 1.3.7 Googleカレンダー連携
- タイムラインの全野菜イベントをGoogleカレンダーにインポート
  - エクスポート時にカレンダー名を設定可能
  - エクスポート時にGoogle Calendar API の書き込み権限を追加要求
- ICSファイルのダウンロードも可能
- 一方向（アプリ → Google）のみ

#### 1.3.8 認証
- Google SSO のみ
- ユーザー: ID（メールアドレス）、表示名
- ログイン不要で使える機能:
  - タイムライン作成・編集
  - ICSファイルダウンロード
  - URL共有
- ログイン必須の機能:
  - テンプレート登録
  - いいね
  - 通報
- 匿名 → ログイン時にタイムラインを引き継ぎ可能

#### 1.3.9 URL共有
- スケジュール（タイムライン）に紐づくURLを発行
- URLを知っている人は誰でも編集可能（後勝ち）
- 所有者:
  - 匿名ユーザー作成: 全員が所有者
  - ログインユーザー作成: 発行者が所有者
- 有効期限: 3ヶ月（タイムラインデータごと削除）、編集で延長
- 同一Cookie UUID あたり同時5個まで発行可能
- ログインユーザーが共有URLを開いた場合: 自分のタイムラインとは別扱い

#### 1.3.10 匿名ユーザー識別
- Cookie（サーバー発行UUID）で識別
- 初回アクセス時にサーバーがUUIDを発行し、HttpOnly Cookieに保存
- URL発行制限のカウントに使用
- ログイン後はユーザーIDに切り替え
- 匿名タイムラインの引き継ぎにも使用（Cookie UUID → ユーザーID紐付け）

### 1.4 非機能要件

#### 1.4.1 性能要件
- タイムラインのドラッグ操作が60fps以上でスムーズに動作すること
- 初期ロード時のデータ取得は1秒以内

#### 1.4.2 対応環境
- PC・モバイル両対応のレスポンシブレイアウト
- モダンブラウザ（Chrome/Firefox/Safari/Edge 最新版）

#### 1.4.3 運用・保守要件
- 期限切れURL共有データの定期クリーンアップ（3ヶ月超のデータ削除）

### 1.5 制約条件
- 温暖地（中部地方）の栽培カレンダーを基準とする

### 1.6 開発環境
- 言語: TypeScript
- フロントエンド: Vite + React
- D&Dライブラリ: @dnd-kit
- 状態管理: Zustand
- スタイル: Tailwind CSS
- バックエンド: Hono
- DB: PostgreSQL
- ホスティング: Railway（フロント + API + PostgreSQL、3サービス構成）

### 1.7 成果物
- ソースコード（フロントエンド・バックエンド）
- 設計書（本ドキュメント）
- テストコード

---

## 2. システム設計

### 2.1 システム概要設計

#### 2.1.1 システムアーキテクチャ

```
[Browser]
  ├─ タイムラインコンポーネント ←→ [Zustandストア] ←→ [REST API]
  ├─ テンプレート一覧           ←→ [Zustandストア] ←→ [REST API]
  └─ 認証（Google SSO）        ←→ [REST API]
                                       ↕
                             [Hono APIサーバー on Railway]
                                       ↕
                             [PostgreSQL on Railway]
```

#### 2.1.2 主要コンポーネント

1. **タイムライン**
   - 3年分（今年1月〜2年後12月末）の週単位ガントチャート
   - スケジュール行の表示・編集
   - イベントバーのドラッグ・リサイズ
   - 行の並べ替え

2. **テンプレート一覧パネル**
   - テンプレートの検索・選択
   - いいね・通報

3. **プラスボタン**
   - テンプレート一覧の表示トリガー

4. **エクスポート**
   - Googleカレンダー連携
   - ICSファイル生成・ダウンロード

#### 2.1.3 ディレクトリ構成（予定）

```
hatakei/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── timeline/
│   │   │   │   ├── タイムライン.tsx
│   │   │   │   ├── スケジュール行.tsx
│   │   │   │   └── イベントバー.tsx
│   │   │   ├── template/
│   │   │   │   ├── テンプレート一覧.tsx
│   │   │   │   ├── テンプレートカード.tsx
│   │   │   │   └── テンプレート検索.tsx
│   │   │   ├── export/
│   │   │   │   └── エクスポートボタン.tsx
│   │   │   └── auth/
│   │   │       └── ログインボタン.tsx
│   │   ├── store/
│   │   │   ├── タイムラインストア.ts
│   │   │   ├── テンプレートストア.ts
│   │   │   └── 認証ストア.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── ics生成.ts
│   │   │   └── 週変換.ts
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── backend/
    ├── src/
    │   ├── index.ts
    │   ├── routes/
    │   │   ├── 認証.ts
    │   │   ├── タイムライン.ts
    │   │   ├── テンプレート.ts
    │   │   ├── 野菜.ts
    │   │   └── 共有.ts
    │   ├── db/
    │   │   ├── スキーマ.ts
    │   │   └── シード.ts
    │   └── middleware/
    │       ├── 認証.ts
    │       └── 匿名識別.ts
    ├── package.json
    └── Dockerfile
```

### 2.2 詳細設計

#### 2.2.1 型定義

```typescript
// 週番号 (0 = 3月第1週, 51 = 2月最終週)
type 週インデックス = number;

// 野菜
type 野菜 = {
  id: string;
  名称: string;
  色: string; // タイムライン行の背景色（hex）
  カスタム: boolean; // true: ユーザー追加
};

// イベント
type イベント = {
  id: string;
  イベント名: string; // 定義済み or 自由入力
  開始週: 週インデックス;
  終了週: 週インデックス;
};

// スケジュール（タイムラインの1行）
type スケジュール = {
  id: string;
  野菜id: string;
  イベント一覧: イベント[];
};

// タイムライン
type タイムライン = {
  id: string;
  名前: string;
  スケジュール一覧: スケジュール[]; // 順序 = 表示順
  所有者id: string | null; // null = 匿名
  作成日時: string;
  最終編集日時: string;
};

// スケジュールテンプレート
type スケジュールテンプレート = {
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
type ユーザー = {
  id: string; // メールアドレス
  表示名: string;
};

// URL共有
type 共有リンク = {
  id: string; // URL用トークン
  タイムラインid: string;
  発行者Cookie: string; // Cookie UUID
  発行者id: string | null; // ログインユーザーの場合
  有効期限: string;
  作成日時: string;
};

// 定義済みイベント名
type 定義済みイベント名 =
  | "種まき"
  | "育苗"
  | "定植"
  | "追肥"
  | "収穫"
  | "土づくり"
  | "剪定"
  | "支柱立て";
```

#### 2.2.2 DBスキーマ（PostgreSQL）

```sql
-- ユーザー
CREATE TABLE ユーザー (
  id              TEXT PRIMARY KEY, -- メールアドレス
  表示名          TEXT NOT NULL,
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

-- 野菜マスタ
CREATE TABLE 野菜 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  名称            TEXT NOT NULL,
  色              TEXT NOT NULL,
  カスタム        BOOLEAN DEFAULT FALSE,
  作成者id        TEXT REFERENCES ユーザー(id),
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

-- タイムライン
CREATE TABLE タイムライン (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  名前            TEXT NOT NULL DEFAULT '無題のタイムライン',
  所有者id        TEXT REFERENCES ユーザー(id), -- NULL = 匿名
  匿名Cookie     TEXT, -- 匿名ユーザーのCookie UUID
  作成日時        TIMESTAMPTZ DEFAULT NOW(),
  最終編集日時    TIMESTAMPTZ DEFAULT NOW()
);

-- スケジュール（タイムラインの1行）
CREATE TABLE スケジュール (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  タイムラインid  UUID NOT NULL REFERENCES タイムライン(id) ON DELETE CASCADE,
  野菜id          UUID NOT NULL REFERENCES 野菜(id),
  表示順          INTEGER NOT NULL DEFAULT 0
);

-- イベント
CREATE TABLE イベント (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  スケジュールid  UUID NOT NULL REFERENCES スケジュール(id) ON DELETE CASCADE,
  イベント名      TEXT NOT NULL,
  開始週          SMALLINT NOT NULL, -- 週インデックス (0-51)
  終了週          SMALLINT NOT NULL
);

-- スケジュールテンプレート
CREATE TABLE スケジュールテンプレート (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  テンプレート名  TEXT NOT NULL,
  説明文          TEXT DEFAULT '',
  野菜id          UUID NOT NULL REFERENCES 野菜(id),
  作成者id        TEXT NOT NULL REFERENCES ユーザー(id),
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

-- テンプレートイベント
CREATE TABLE テンプレートイベント (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  テンプレートid  UUID NOT NULL REFERENCES スケジュールテンプレート(id) ON DELETE CASCADE,
  イベント名      TEXT NOT NULL,
  開始週          SMALLINT NOT NULL,
  終了週          SMALLINT NOT NULL
);

-- テンプレートタグ
CREATE TABLE テンプレートタグ (
  テンプレートid  UUID NOT NULL REFERENCES スケジュールテンプレート(id) ON DELETE CASCADE,
  タグ            TEXT NOT NULL,
  PRIMARY KEY (テンプレートid, タグ)
);

-- テンプレートいいね
CREATE TABLE テンプレートいいね (
  テンプレートid  UUID NOT NULL REFERENCES スケジュールテンプレート(id) ON DELETE CASCADE,
  ユーザーid      TEXT NOT NULL REFERENCES ユーザー(id),
  PRIMARY KEY (テンプレートid, ユーザーid)
);

-- テンプレート通報
CREATE TABLE テンプレート通報 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  テンプレートid  UUID NOT NULL REFERENCES スケジュールテンプレート(id) ON DELETE CASCADE,
  通報者id        TEXT NOT NULL REFERENCES ユーザー(id),
  理由            TEXT,
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

-- URL共有
CREATE TABLE 共有リンク (
  id              TEXT PRIMARY KEY, -- URL用トークン
  タイムラインid  UUID NOT NULL REFERENCES タイムライン(id) ON DELETE CASCADE,
  発行者Cookie    TEXT NOT NULL,
  発行者id        TEXT REFERENCES ユーザー(id),
  有効期限        TIMESTAMPTZ NOT NULL,
  作成日時        TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_スケジュール_タイムライン ON スケジュール(タイムラインid);
CREATE INDEX idx_イベント_スケジュール ON イベント(スケジュールid);
CREATE INDEX idx_テンプレートイベント_テンプレート ON テンプレートイベント(テンプレートid);
CREATE INDEX idx_テンプレートいいね_テンプレート ON テンプレートいいね(テンプレートid);
CREATE INDEX idx_共有リンク_タイムライン ON 共有リンク(タイムラインid);
CREATE INDEX idx_共有リンク_有効期限 ON 共有リンク(有効期限);
CREATE INDEX idx_タイムライン_匿名Cookie ON タイムライン(匿名Cookie);
```

#### 2.2.3 APIエンドポイント

注: URLパスは英語を使用する（日本語URLはエンコード問題を避けるため不使用）。

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | /api/vegetables | 全野菜一覧取得 | 不要 |
| POST | /api/vegetables | カスタム野菜追加 | 必要 |
| GET | /api/timelines | 自分のタイムライン一覧取得 | 必要 |
| POST | /api/timelines | タイムライン作成 | 不要（匿名可） |
| GET | /api/timelines/:id | タイムライン詳細取得 | 不要 |
| PUT | /api/timelines/:id | タイムライン更新 | 不要（後勝ち） |
| DELETE | /api/timelines/:id | タイムライン削除 | 所有者のみ |
| POST | /api/timelines/:id/schedules | スケジュール行追加 | 不要 |
| PUT | /api/timelines/:id/schedules/:sid | スケジュール行更新 | 不要 |
| DELETE | /api/timelines/:id/schedules/:sid | スケジュール行削除 | 不要 |
| PUT | /api/timelines/:id/order | スケジュール行の並び替え | 不要 |
| POST | /api/timelines/:id/schedules/:sid/events | イベント追加 | 不要 |
| PUT | /api/timelines/:id/schedules/:sid/events/:eid | イベント更新 | 不要 |
| DELETE | /api/timelines/:id/schedules/:sid/events/:eid | イベント削除 | 不要 |
| GET | /api/templates | テンプレート一覧（検索対応） | 不要 |
| POST | /api/templates | テンプレート登録 | 必要 |
| PUT | /api/templates/:id | テンプレート更新 | 作成者のみ |
| DELETE | /api/templates/:id | テンプレート削除 | 作成者のみ |
| POST | /api/templates/:id/likes | いいね追加 | 必要 |
| DELETE | /api/templates/:id/likes | いいね取り消し | 必要 |
| POST | /api/templates/:id/reports | テンプレート通報 | 必要 |
| POST | /api/shares | 共有リンク発行 | 不要（Cookie制限） |
| GET | /api/shares/:token | 共有タイムライン取得 | 不要 |
| GET | /api/auth/google | Google OAuth開始 | - |
| GET | /api/auth/google/callback | Google OAuthコールバック | - |
| POST | /api/auth/logout | ログアウト | 必要 |
| GET | /api/auth/me | ログイン中ユーザー情報 | 必要 |
| GET | /api/export/:timelineId/ics | ICSファイルダウンロード | 不要 |
| POST | /api/エクスポート/:タイムラインid/google | Googleカレンダーエクスポート | 必要（Calendar権限） |

#### 2.2.4 週インデックス仕様

| 週インデックス | 対応する週 |
|---|---|
| 0 | 3月 第1週 |
| 1 | 3月 第2週 |
| ... | ... |
| 3 | 3月 第4週 |
| 4 | 4月 第1週 |
| ... | ... |
| 51 | 2月 最終週 |

月ごとの開始インデックス:

| 月 | 週インデックス |
|---|---|
| 3月 | 0 |
| 4月 | 4 |
| 5月 | 9 |
| 6月 | 13 |
| 7月 | 17 |
| 8月 | 22 |
| 9月 | 26 |
| 10月 | 30 |
| 11月 | 35 |
| 12月 | 39 |
| 1月 | 43 |
| 2月 | 48 |

### 2.3 インターフェース設計

#### 2.3.1 レイアウト

```
┌──────────────────────────────────────────┐
│  [ログイン] [エクスポート]    ヘッダー     │
├──────────────────────────────────────────┤
│  野菜名 │ 1月 │ 2月 │ ... │ 12月 │       │
│  ───────┼─────┼─────┼─────┼──────┤       │
│  トマト  │████ 種まき ████│██ 収穫 ██│    │
│  キュウリ│   ████ 定植 ████│█ 収穫 █│    │
│  ...    │                              │
├──────────────────────────────────────────┤
│                                    [+]   │
└──────────────────────────────────────────┘
```

#### 2.3.2 タイムライン操作
- イベントの追加: スケジュール行をクリック → イベント名・期間を入力
- イベントの移動: D&Dで週をまたいで移動
- イベントのリサイズ: バー端をドラッグ
- イベントの削除: イベントを右クリック → 削除
- 行の並べ替え: 行をD&Dで上下移動
- スケジュール行の追加: 右下[+]ボタン → テンプレート一覧 → 選択

### 2.4 セキュリティ設計
- Google OAuth 2.0 による認証
- セッション管理: HttpOnly Cookie
- 匿名ユーザー識別: HttpOnly Cookie（サーバー発行UUID）
- CORS設定でフロントエンドドメインのみ許可
- 入力値のXSS対策: Reactのエスケープに依存（dangerouslySetInnerHTMLは使用しない）
- SQL Injection対策: パラメータ化クエリの使用
- URL共有トークン: 暗号的にランダムな文字列（crypto.randomUUID等）
- IPベースのレートリミット（DoS対策）

### 2.5 テスト設計
- ユニットテスト（Vitest）
  - Zustandストアの各アクション
  - 週インデックス変換ロジック
  - ICSファイル生成ロジック
- コンポーネントテスト（Vitest + Testing Library）
  - タイムライン: イベントバーの表示・操作
  - テンプレート一覧: 検索・いいね
- APIテスト
  - 各エンドポイントのレスポンス形式検証
  - 認証・権限チェック

### 2.6 開発工程

#### 2.6.1 開発フェーズ

1. **Phase 1: 基盤再構築**
   - 既存マップ関連コードの削除
   - 新しい型定義・DBスキーマの実装
   - Google OAuth認証の実装
   - 匿名ユーザー識別（Cookie UUID）の実装

2. **Phase 2: タイムライン機能**
   - ガントチャート形式のタイムライン描画（3年分）
   - スケジュール行の表示
   - イベントバーの表示・追加・削除・移動・リサイズ
   - 行の並べ替え

3. **Phase 3: テンプレート機能**
   - テンプレートのCRUD API
   - テンプレート一覧画面（検索・ソート）
   - テンプレートからタイムラインへの追加
   - いいね・タグ・通報機能

4. **Phase 4: 共有・エクスポート**
   - URL共有（発行・アクセス・有効期限管理）
   - ICSファイル生成・ダウンロード
   - Googleカレンダーエクスポート

5. **Phase 5: 仕上げ**
   - レスポンシブ対応
   - 期限切れデータのクリーンアップジョブ
   - Railway デプロイ

#### 2.6.2 マイルストーン
- M1: Google SSOでログインし、空のタイムラインが表示される
- M2: タイムライン上でイベントをD&D配置・編集できる
- M3: テンプレートを登録し、他ユーザーが検索・追加できる
- M4: URL共有でタイムラインを共有・共同編集できる
- M5: Googleカレンダー・ICSエクスポートが動作する
