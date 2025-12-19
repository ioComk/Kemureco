# 1) Node.js の公式イメージ（開発しやすい安定版）
FROM node:20-slim

# 2) コンテナ内の作業ディレクトリ
WORKDIR /app

# 3) 依存関係ファイルだけ先にコピー
#    → ここまでを先にやると、ソース変更時も npm install のキャッシュが効きやすい
COPY package.json package-lock.json* ./

# 4) 依存関係をインストール（lock があればそれに従う）
RUN npm ci || npm install

# 5) 残りのソースをコピー
COPY . .

# 6) Next.js の開発サーバーポート
EXPOSE 3000

# 7) 開発サーバー起動（ホットリロード）
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
