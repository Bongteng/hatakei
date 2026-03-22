# hatakei プロジェクト指示

## ドキュメント管理（必須）

### 仕様・設計の記録
- `doc/design.md` が仕様・設計の信頼できる唯一の情報源（Single Source of Truth）
- 仕様変更・機能追加・設計変更があった場合は、コード変更と同時に `doc/design.md` を更新すること
- 会話の中だけで決まった仕様を、ドキュメントに反映せず放置してはならない

### ADR（Architecture Decision Records）
- 重要な技術的判断（ライブラリ選定、設計方針変更、トレードオフを伴う判断）は `doc/adr/` に記録する
- フォーマット: `doc/adr/NNNN-タイトル.md`
- 内容: 背景、選択肢、決定、理由

### Phase進捗
- 開発フェーズの進捗はメモリの `project_spec_v2.md` で追跡する
- Phaseが完了したら、コミットハッシュと共に状態を更新する

## 技術スタック
- フロントエンド: Vite + React + Zustand + Tailwind CSS + @dnd-kit
- バックエンド: Hono + PostgreSQL
- ホスティング: Railway
- 詳細は `doc/design.md` を参照
