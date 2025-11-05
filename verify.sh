#!/bin/bash

# テスト検証スクリプト
# このスクリプトは開発環境のセットアップを検証するためのものです

set -e

echo "=== Kemureco 環境セットアップ検証 ==="
echo

# 1. Docker設定の検証
echo "1. Docker Compose設定の検証..."
docker compose -f docker-compose.dev.yml config > /dev/null && echo "✓ docker-compose.dev.yml OK"
docker compose -f docker-compose.yml config > /dev/null && echo "✓ docker-compose.yml OK"
echo

# 2. Rustバックエンドのビルド検証
echo "2. Rustバックエンドのビルド検証..."
cd backend
cargo check --quiet && echo "✓ Rustコードのコンパイル成功"
cd ..
echo

# 3. Next.jsフロントエンドのビルド検証
echo "3. Next.jsフロントエンドのビルド検証..."
cd frontend
npm run lint --silent && echo "✓ ESLintチェック成功"
npm run build > /dev/null 2>&1 && echo "✓ Next.jsビルド成功"
cd ..
echo

echo "=== 全ての検証が完了しました ==="
echo
echo "次のステップ:"
echo "  1. 環境変数を設定: cp .env.example .env"
echo "  2. 開発環境起動: make up-dev"
echo "  3. アクセス確認:"
echo "     - フロントエンド: http://localhost:3000"
echo "     - API: http://localhost:8080/health"
echo "     - pgweb: http://localhost:8081"
