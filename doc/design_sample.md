# 要件・設計書

## 1. 要件定義

### 1.1 基本情報
- ソフトウェア名称: DocuBot
- リポジトリ名: docubot

### 1.2 プロジェクト概要

本プロジェクトは、チャットを通じて要件定義書と設計書を自動生成するシステムを開発することを目的としています。
ユーザーとAIのインタラクティブなコミュニケーションを通じて、徐々に要件と設計を具体化していく支援ツールです。

### 1.3 機能要件

#### 1.3.1 基本機能
- OpenAIの複数のLLMモデルを選択可能
  - モデル切り替え機能
  - 各モデルに適したパラメータの自動設定
- Gradioベースのユーザーインターフェース
  - チャットインターフェース
  - モデル選択UI
- ストリーミング形式での応答出力
- 会話履歴の管理

#### 1.3.2 文書生成機能
- 要件定義と設計を統合した文書の自動生成
- 生成された文書の編集・更新機能
- 文書生成時のFew-shotプロンプト活用

### 1.4 非機能要件

#### 1.4.1 性能要件
- ストリーミングレスポンスによるリアルタイムな応答表示
- 複数ユーザーの同時アクセス対応

#### 1.4.2 セキュリティ要件
- OpenAI APIキーの安全な管理
- 会話履歴の適切な保護

#### 1.4.3 運用・保守要件
- エラー発生時の適切なエラーハンドリング
- ログ出力による動作記録
- 設定ファイルによる容易な環境設定

### 1.5 制約条件
- Python 3.8以上での動作保証
- OpenAI APIの利用制限への対応
- Gradioフレームワークの制約への準拠

### 1.6 開発環境
- 言語：Python
- フレームワーク：Gradio
- 外部API：OpenAI API
- 開発ツール：VSCode

### 1.7 成果物
- ソースコード
- 設計書
- テストコード
- README（セットアップ手順含む）
- 要件定義書

## 2. システム設計

### 2.1 システム概要設計

#### 2.1.1 システムアーキテクチャ
```
[Gradio UI] <-> [Chat Controller] <-> [OpenAI API Client] <-> [OpenAI API]
```

#### 2.1.2 主要コンポーネント
1. Gradio UI
   - チャットインターフェース
   - モデル選択ドロップダウン
   - ストリーミング出力表示
2. Chat Controller
   - 会話管理
   - 文書生成制御
3. OpenAI API Client
   - API通信制御
   - モデル別パラメータ管理

#### 2.1.3 モデル設定
- デフォルトモデル: chatgpt-4o-latest
- 利用可能なモデル:
  - chatgpt-4o-latest
  - gpt-4
  - o1
  - o3-mini
  - その他OpenAI APIで利用可能なモデル
- モデル別パラメータ:
  - o1, o3-mini:
    - max_completion_tokens: 4000
    - stream: true
  - その他のモデル:
    - max_tokens: 4000
    - temperature: 0
    - stream: true

### 2.2 詳細設計

#### 2.2.1 クラス設計

##### 2.2.1.1 OpenAIClient
```python
class OpenAIClient:
    """OpenAI APIとの通信を管理するクラス"""
    DEFAULT_MODEL = "chatgpt-4o-latest"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_available_models(self) -> List[str]:
        """利用可能なモデル一覧を取得"""

    async def generate_stream(self, model: str, messages: List[dict]) -> AsyncGenerator:
        """ストリーミング形式でレスポンスを生成"""

    def _get_model_params(self, model: str) -> dict:
        """モデル別のパラメータを設定"""
```

##### 2.2.1.2 ChatController
```python
class ChatController:
    """チャット制御とドキュメント生成を管理するクラス"""
    def __init__(self, openai_client: OpenAIClient):
        self.client = openai_client
        self.history = []
        self.current_model = openai_client.DEFAULT_MODEL

    async def process_message(self, message: str, model: str) -> AsyncGenerator:
        """メッセージを処理しレスポンスを生成"""

    async def generate_document(self) -> AsyncGenerator:
        """要件定義と設計を統合した文書を生成"""

    def update_history(self, role: str, content: str):
        """会話履歴を更新"""

    def change_model(self, model: str):
        """使用するモデルを変更"""
```

##### 2.2.1.3 GradioInterface
```python
class GradioInterface:
    """Gradioインターフェースを管理するクラス"""
    def __init__(self, controller: ChatController):
        self.controller = controller

    def build_interface(self) -> gr.Interface:
        """Gradioインターフェースを構築"""
        with gr.Blocks() as interface:
            with gr.Row():
                model_dropdown = gr.Dropdown(
                    choices=self.controller.client.get_available_models(),
                    value=self.controller.current_model,
                    label="モデルを選択"
                )
            # その他のUI要素

    async def chat_stream(self, message: str, model: str, history: List[List[str]]) -> Generator:
        """チャットストリームを処理"""
```

#### 2.2.2 データフロー
1. ユーザーがメッセージを入力
2. GradioInterfaceがメッセージを受け取り、ChatControllerに転送
3. ChatControllerがOpenAIClientを使用してAPIリクエストを生成
4. OpenAIClientがストリーミングレスポンスを取得
5. レスポンスがGradioInterfaceを通じてユーザーに表示

#### 2.2.3 エラーハンドリング
- API通信エラー
- モデル制限エラー
- 入力バリデーションエラー
- ストリーミング中断エラー

### 2.3 インターフェース設計

#### 2.3.1 Gradio UI構成
- モデル選択ドロップダウン（上部に配置）
  - デフォルト値: chatgpt-4o-latest
  - 動的に利用可能なモデルをリスト表示
- チャット履歴表示エリア
- メッセージ入力エリア
- ドキュメント生成ボタン（要件・設計書を統合）
- 生成文書表示・編集エリア

#### 2.3.2 API通信
- OpenAI APIとの通信プロトコル
- ストリーミングレスポンスの処理
- エラーレスポンスのハンドリング

### 2.4 セキュリティ設計
- API認証情報の環境変数管理
- 入力データのサニタイズ
- エラーメッセージのセキュアな表示

### 2.5 テスト設計
- ユニットテスト
  - OpenAIClient
    - モデル一覧取得
    - パラメータ設定
  - ChatController
    - モデル切り替え
    - メッセージ処理
  - GradioInterface
    - UIコンポーネント
    - イベントハンドリング
- 統合テスト
  - エンドツーエンドのチャットフロー
  - 文書生成フロー
  - モデル切り替えフロー
- エラーケーステスト
  - API通信エラー
  - 入力バリデーション
  - ストリーミング中断

### 2.6 開発環境・依存関係
- Python 3.8+
- Gradio
- OpenAI Python SDK
- pytest（テスト用）
- python-dotenv（環境変数管理）

### 2.7 開発工程

#### 2.7.1 開発フェーズ
1. 要件分析・定義フェーズ（第1週）
   - 要件の明確化
   - ユースケースの定義
   - 機能要件・非機能要件の文書化
2. 設計フェーズ（第2週）
   - システムアーキテクチャの設計
   - クラス設計・インターフェース設計
   - データフロー設計
3. 実装フェーズ（第3-4週）
   - OpenAI API Clientの実装
   - Chat Controllerの実装
   - Gradio UIの実装
4. テストフェーズ（第5週）
   - ユニットテストの実装と実行
   - 統合テストの実装と実行
   - バグ修正
5. デプロイ・ドキュメント作成フェーズ（第6週）
   - デプロイ手順の作成
   - ユーザーマニュアルの作成
   - 技術文書の完成

#### 2.7.2 マイルストーンとタスク優先順位
- マイルストーン1: 基本API通信機能の完成（第3週末）
  - OpenAI APIとの通信確立
  - モデル切り替え機能
  - ストリーミングレスポンス処理
- マイルストーン2: UI基本機能の完成（第4週末）
  - チャットインターフェース実装
  - モデル選択UI実装
  - ストリーミング表示機能実装
- マイルストーン3: 文書生成機能の完成（第5週中）
  - 要件定義書生成機能
  - 設計書生成機能
- マイルストーン4: 完全版リリース（第6週末）
  - テスト完了
  - ドキュメント完成
  - デプロイ完了

#### 2.7.3 リスク管理
- OpenAI APIの仕様変更リスク
  - 対応策: 柔軟なAPIクライアント設計、変更通知の監視
- スケジュール遅延リスク
  - 対応策: バッファ期間の確保、優先機能の明確化
- 技術的課題リスク
  - 対応策: 早期プロトタイピング、技術調査の徹底