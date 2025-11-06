# Kemureco

シーシャのフレーバーを記録し、おすすめミックスを探す Web アプリです。Next.js (App Router) と Supabase を用いたフルスタック構成で、Cloudflare Pages へそのままデプロイできます。

## 技術スタック

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui コンポーネント
- Supabase (Database / Auth / Edge Functions)
- Cloudflare Pages + `@cloudflare/next-on-pages`

## 事前準備

- Node.js 20 以上
- Supabase プロジェクト
- Cloudflare アカウント（Pages 利用）

## セットアップ

1. 依存関係のインストール

   ```bash
   npm install
   ```

2. 環境変数の設定

   `.env.local` を作成して以下を設定します（`.env.example` を参照）。

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseURL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=Anonキー
   ```

3. データベーススキーマの適用

   Supabase ダッシュボードの SQL Editor で [`supabase/schema.sql`](supabase/schema.sql) を実行します。RLS 付きで `brands`, `flavors`, `mixes`, `mix_components`, `sessions` が作成されます。

4. 初期データ投入（任意）

   ```sql
   insert into public.brands (name) values ('Trifecta'), ('Azure'), ('Al Fakher');
   insert into public.flavors (brand_id, name, tags) values
     (1, 'Peppermint Shake', '{mint,dessert}'),
     (2, 'Lemon Muffin', '{citrus,lemon}'),
     (3, 'Double Apple', '{apple,classic}');
   ```

5. Edge Function のデプロイ（推奨）

   Supabase CLI を利用してローカルからデプロイします。

   ```bash
   npx supabase functions deploy recommend
   ```

6. ローカル開発サーバの起動

   ```bash
   npm run dev
   ```

   ブラウザで <http://localhost:3000> を開きます。

## 機能概要

- `/` トップページ
  - Supabase Edge Function (`/functions/v1/recommend`) の結果をカード表示
  - 最近のセッション（ダミーデータ）表示
- `/mixes/new` ミックス作成
  - Supabase から `flavors` を取得し、3 段構成の比率スライダーで合計 100% を強制
  - Supabase Auth でサインイン済みのユーザーのみ `mixes` / `mix_components` に保存
  - 成功時に toast 通知

## shadcn/ui について

主要コンポーネントは `src/components/ui` にコミット済みです。追加でコンポーネントを生成する場合は以下コマンドの例を参考にしてください。

```bash
npx shadcn-ui@latest add button
```

## Supabase ローカル実行 (任意)

`supabase/config.toml` を用意してあるため、ローカルで Supabase を動かす場合は以下を実行します。

```bash
npx supabase start
```

## Cloudflare Pages へのデプロイ

1. Cloudflare Pages で新規プロジェクトを作成し、このリポジトリを接続
2. Framework: **Next.js** を選択
3. ビルドコマンド: `npm run build:cf`
4. 出力ディレクトリ: `.vercel/output/static`
5. 環境変数に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
6. デプロイ完了後、Supabase Edge Functions も合わせてデプロイしておくと `/functions/v1/recommend` が利用できます

プレビューをローカルで確認する場合は Cloudflare CLI を利用します。

```bash
npm run preview:cf
```

## 将来の拡張メモ

- Supabase Edge Functions / Cloudflare Workers を用いた BFF レイヤーの追加
- Supabase Storage + Cloudflare R2 を利用したメディア管理
- Supabase Auth UI / OAuth 連携によるサインインフロー
- ミックス履歴ページ、在庫管理、検索機能など

## ライセンス

本リポジトリは [MIT License](LICENSE) です。
