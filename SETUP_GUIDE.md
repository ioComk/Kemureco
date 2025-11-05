# Kemureco セットアップガイド

このガイドでは、Kemurecoプロジェクトのセットアップと使用方法について説明します。

## 📋 前提条件

以下がインストールされていることを確認してください:
- Docker Desktop または Docker Engine
- Docker Compose v2
- Make (オプション: Makefileコマンドを使用する場合)

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/ioComk/Kemureco.git
cd Kemureco
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

必要に応じて `.env` ファイルを編集してください。

### 3. セットアップの検証 (オプション)

```bash
./verify.sh
```

このスクリプトは以下を検証します:
- Docker Compose設定の妥当性
- Rustコードのコンパイル
- Next.jsプロジェクトのビルド

### 4. 開発環境の起動

```bash
make up-dev
```

または

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 5. アクセス確認

起動後、以下のURLでアクセス可能になります:

- **フロントエンド**: http://localhost:3000
- **API (ヘルスチェック)**: http://localhost:8080/health
- **pgweb (DB管理)**: http://localhost:8081

## 📁 プロジェクト構造

```
Kemureco/
├── backend/              # Rust APIサーバー
│   ├── src/
│   │   └── main.rs      # メインアプリケーション
│   ├── Cargo.toml       # Rust依存関係
│   ├── Dockerfile       # 本番用Dockerfile
│   └── Dockerfile.dev   # 開発用Dockerfile
├── frontend/            # Next.js Webアプリ
│   ├── app/            # App Router
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── Dockerfile      # 本番用Dockerfile
│   └── package.json    # npm依存関係
├── docker-compose.dev.yml   # 開発環境設定
├── docker-compose.yml       # 本番環境設定
├── Makefile            # 便利コマンド集
├── .env.example        # 環境変数テンプレート
├── .gitignore          # Git除外設定
└── README.md           # プロジェクト概要
```

## 🛠️ 利用可能なコマンド

### Make コマンド

```bash
make help       # ヘルプを表示
make up-dev     # 開発環境を起動
make up-prod    # 本番環境を起動
make down-dev   # 開発環境を停止
make down-prod  # 本番環境を停止
make logs-dev   # 開発環境のログを表示
make logs-prod  # 本番環境のログを表示
make clean      # 全てのコンテナとボリュームを削除
```

### Docker Compose コマンド (直接実行)

```bash
# 開発環境
docker compose -f docker-compose.dev.yml up -d    # 起動
docker compose -f docker-compose.dev.yml down     # 停止
docker compose -f docker-compose.dev.yml logs -f  # ログ表示

# 本番環境
docker compose -f docker-compose.yml up -d --build  # ビルドして起動
docker compose -f docker-compose.yml down           # 停止
docker compose -f docker-compose.yml logs -f        # ログ表示
```

## 🔧 開発環境の特徴

### ホットリロード

開発環境では、コードの変更が自動的に反映されます:

- **Rust (backend)**: `cargo-watch` により、ファイル変更時に自動再コンパイル・再起動
- **Next.js (frontend)**: HMR (Hot Module Replacement) により、ブラウザの自動リロードなしで変更を反映

### データベース管理

pgwebを使用してブラウザからPostgreSQLデータベースを管理できます:

- URL: http://localhost:8081
- 接続情報は `.env` ファイルで設定

## 🏭 本番環境の特徴

### 最適化されたビルド

- **Rust**: リリースモードでコンパイル、マルチステージビルドで軽量化
- **Next.js**: Standalone出力モードで必要最小限のファイルのみ含む

### 自動再起動

本番環境では `restart: unless-stopped` が設定されており、コンテナが異常終了した場合に自動的に再起動します。

## 🐛 トラブルシューティング

### ポートが既に使用されている

別のアプリケーションが同じポートを使用している場合、docker-compose ファイルでポート番号を変更してください:

```yaml
ports:
  - "3001:3000"  # 例: フロントエンドを3001にマップ
```

### データベースが起動しない

データベースのボリュームをクリアして再起動:

```bash
make clean
make up-dev
```

### コンテナのログを確認

```bash
make logs-dev
# または特定のサービスのみ
docker compose -f docker-compose.dev.yml logs backend
```

## 📝 開発ワークフロー

1. **機能開発**
   ```bash
   make up-dev
   # コードを編集（自動リロード）
   ```

2. **テスト**
   ```bash
   cd backend && cargo test
   cd frontend && npm test
   ```

3. **本番ビルドの確認**
   ```bash
   make up-prod
   # 動作確認
   make down-prod
   ```

4. **クリーンアップ**
   ```bash
   make clean
   ```

## 🔒 セキュリティ

- 本リポジトリの依存関係は全てセキュリティスキャン済み
- CodeQL解析済み (アラート0件)
- 定期的な依存関係の更新を推奨

## 📚 技術スタック詳細

- **Backend**: Rust 1.82, Axum 0.7
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL 17
- **Container**: Docker, Docker Compose v2

## 🤝 コントリビューション

1. フィーチャーブランチを作成
2. 変更をコミット
3. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。
