# CLAUDE.md — Kemureco

## Purpose
Kemurecoは、シーシャ利用者がフレーバーの記録・管理・共有・おすすめを受けられるWebプラットフォーム・モバイル対応アプリです。

---

## Design & Reference Rules
- UIは **shadcn/ui** を優先使用
- 認可・制限は **Supabase RLS** で実装

---

## Technical Stack (固定)
- **Frontend**: Next.js 14 (App Router) + TypeScript + shadcn/ui
- **Backend**: Supabase (PostgREST + Auth + RLS + Edge Functions)
- **Deploy**: Cloudflare Pages (フロント) + Supabase (DB/API/ストレージ)

---

## 主要ユースケース
1. フレーバー閲覧（一般ユーザー）
2. ミックス作成（ログインユーザー）
3. 吸った記録の保存（ログインユーザー）
4. おすすめミックス提示（ログインユーザー / AI）
5. お気に入り登録（ログインユーザー）
6. プロフィール設定（ログインユーザー）
7. ゲスト閲覧（未ログインユーザー）

---

## 機能要件（概要）

### 認証
- メール/Googleログイン（Supabase Auth）
- 年齢確認（20歳未満は投稿不可、プロフィールの生年月日で判定、RLSで制御）
- ログアウト

### フレーバー管理
- フレーバー一覧（`flavors`参照、ブランド/タグ/人気順）
- 検索（部分一致・タグ）
- 詳細表示（タグ・説明・レビュー統計）
- 登録（管理者のみ / RLS）

### ミックス作成・管理
- 作成：最大4種、比率合計100%で保存
- 編集：タイトル/説明/比率
- 削除：所有者のみ
- 一覧：自分のミックス
- 共有：公開設定ミックスをURL共有（RLS）

### セッション（吸った記録）
- 記録登録：ミックス、日付、満足度、場所
- 一覧：カレンダー/タイムライン
- 集計：使用頻度、満足度平均 など

### レコメンド
- 季節ベース
- 嗜好ベース（履歴/満足度）
- 人気トレンド
- Supabase Edge Function `recommend` から JSON 返却

### UI/UX
- shadcn/ui（Button, Dialog, Toast, Table, Select, Slider など）
- ライト/ダーク切替（Tailwind class）
- Toast通知（成功/失敗/警告）
- レスポンシブ（スマホ優先）

---

## データモデル（概要）
- `users`（id, email, display_name）
- `brands`（id, name, jp_available）
- `flavors`（id, brand_id, name, tags）
- `mixes`（id, user_id, title, description）
- `mix_components`（mix_id, flavor_id, ratio_percent）
- `sessions`（id, user_id, started_at, location_text）

### 主なリレーション
- users -> mixes (1:N)
- mixes -> mix_components (1:N)
- brands -> flavors (1:N)
- users -> sessions (1:N)

---

## 非機能要件
- 初期ロード < 2.5s（Cloudflare CDN キャッシュ活用）
- セキュリティ: Supabase Auth + RLS、署名付き操作は Edge Functions
- 運用コスト: 無料枠（Cloudflare Pages + Supabase Free）を前提
- 拡張性: Workers / R2 での拡張余地
- 可観測性: Cloudflare Analytics + Supabase Logs
- 多言語化: 日本語 -> 英語を i18n で段階導入予定