# Kemureco

Docker環境でRust API、Next.js Web、PostgresDBを統合した開発・本番環境。

## 技術スタック

- **Backend**: Rust (Axum)
- **Frontend**: Next.js (TypeScript + Tailwind CSS)
- **Database**: PostgreSQL 17
- **Container**: Docker + Docker Compose

## セットアップ

### 前提条件

- Docker
- Docker Compose
- Make

### 環境変数の設定

```bash
cp .env.example .env
```

## 使い方

### 開発環境

```bash
# 開発環境の起動（ホットリロード有効）
make up-dev

# ログの確認
make logs-dev

# 開発環境の停止
make down-dev
```

起動後、以下のURLでアクセス可能:
- フロントエンド: http://localhost:3000
- API: http://localhost:8080/health
- pgweb（DBビューア）: http://localhost:8081

### 本番環境

```bash
# 本番環境の起動（ビルド済みイメージ）
make up-prod

# ログの確認
make logs-prod

# 本番環境の停止
make down-prod
```

### その他のコマンド

```bash
# ヘルプの表示
make help

# 全てのコンテナとボリュームを削除
make clean
```

## 開発機能

- **ホットリロード**:
  - Rust: `cargo-watch`による自動再起動
  - Next.js: HMR（Hot Module Replacement）
- **CORS**: フロントエンドからAPIへのアクセス対応
- **データベース管理**: pgwebによるGUI

## プロジェクト構造

```
.
├── backend/          # Rust APIサーバー
│   ├── src/
│   ├── Cargo.toml
│   ├── Dockerfile
│   └── Dockerfile.dev
├── frontend/         # Next.js Webアプリ
│   ├── app/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.dev.yml   # 開発環境設定
├── docker-compose.yml       # 本番環境設定
├── Makefile
└── .env.example
```

## ライセンス

MIT License