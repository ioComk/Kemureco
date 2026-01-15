## LOG.md Summary

### Project Overview
Kemureco is a web platform for shisha users, focused on accurate session/flavor recording, strong filtering UX, and stable deployment using Next.js, Supabase, and Cloudflare Pages.

---

### Core Timeline

#### Initial Setup (Nov 2025)
- Project initialized with Next.js + Supabase
- Added Email/Google authentication
- Implemented basic flavor list, mix creation, and session logging
- Stabilized Cloudflare Pages builds

#### Feature Expansion (Nov–Dec 2025)
- Implemented mix dashboard, sliders, and theme switching
- Added X (Twitter) OAuth authentication
- Added grid/list toggle and image upload for flavors
- Implemented calendar modal with view/edit/delete/X-post actions
- Improved flavor search accuracy, including Japanese input
- Added free-text suggestions for session flavor input

#### UX & UI Refinement (Late Dec 2025)
- Major UI/UX overhaul across Home, Calendar, Records, and Modals
- Unified light/dark themes, buttons, borders, and icons
- Refreshed authentication UI and user menu
- Improved accessibility (ARIA titles, contrast, focus handling)
- Refactored calendar modal to shadcn/ui Carousel layout
- Enhanced satisfaction icons, card layouts, and visual hierarchy
- Added session overview charts (weekly/monthly/yearly)
- Standardized date formats and record card actions
- Improved flavor mix visualization (stacked bars, grams-first display)

#### Location & Maps
- Migrated location input to Mapbox Searchbox API
- Added manual location entry for unregistered shops
- Generated Google Maps links from stored or manual locations
- Added location history suggestions from past sessions
- Prepared schema for future Google Places integration

#### Flavor & Filtering
- Improved flavor filtering by tags and brands (multi-select, URL sync)
- Switched brand/manufacturer filtering to ID-based logic
- Added client-side caching to avoid unnecessary refetching
- Ensured newly created flavors and brands appear immediately
- Improved kana-to-English flavor name matching

#### Stability & Build Fixes
- Fixed multiple TypeScript and Next.js build errors
- Resolved Supabase insert typing issues via explicit required columns
- Unified route/link typing to prevent build failures
- Stabilized Cloudflare Pages builds and dependencies

#### Recent Updates (Jan 2026)
- Synced flavor lists after creation without reload
- Removed unnecessary fields from flavor creation form
- Improved client-side caching for instant filter rendering
- Fixed post-login redirect to Home
- Prevented regressions by maintaining client-fetched data
- Prevented location autocomplete from opening automatically when entering session edit mode
- Applied the same card-style layout to the flavor section in the session list view

---

### Key Principles
- Prefer client-side state consistency over refetching
- Enforce type safety aligned with Supabase schemas
- Treat accessibility and dark mode as first-class concerns
- Centralize decisions and progress in LOG.md for handover

---

### 2026-01-15 追加: Starline 50gフレーバー登録
- ASLAJカテゴリ ct119（Starline 50g）掲載の10フレーバーをシード追加
- ブランド `Starline` を登録し、同一ブランド・同名フレーバーは重複挿入しないSQLに統一

---

### 2026-01-15 追加: Starline 50g画像登録
- ASLAJ ct119の画像を取得し、SquooshでWebP圧縮（quality 70 / effort 7）
- `flavor-images` バケット直下に `<FLAVOR_NAME>.webp` でアップロード
- Starlineフレーバーの `image_path` を `<FLAVOR_NAME>.webp` に更新するマイグレーションを追加

---

### 2026-01-15 追加: Starline画像マイグレーション適用
- Supabaseプロジェクトをリンクし、Starlineフレーバー/画像のマイグレーションをリモートへ適用
- `http://localhost:3000` のHTTP 200を確認

---

### 2026-01-15 追加: Starlineフレーバー公開対応
- Starlineフレーバーの `created_by` をNULLに更新し、全ユーザーが参照可能な既存フレーバー扱いに統一
- `image_path` を `flavors/Starline/<FLAVOR_NAME>.webp` に合わせてマイグレーションを更新

---

### 2026-01-15 追加: Starline公開・画像パス更新
- 既存マイグレーションは変更せず、Starlineフレーバーの `created_by` をNULLに更新する追加入力を作成
- `image_path` を `flavors/Starline/<FLAVOR_NAME>.webp` に更新する追加入力を作成

---

### 2026-01-15 追加: Starlineフレーバー再シード
- Starlineフレーバーが一覧に表示されないため、画像パスとcreated_by=NULLを含めた再シードマイグレーションを追加

---

### 2026-01-15 追加: DOZAJフレーバー登録
- NEWEMO SHISHAのdozajページから40種を抽出し、DOZAJブランドでシード登録
- フレーバー名から推測したタグを付与し、`image_path` を `flavors/DOZAJ/<FLAVOR_NAME>.webp` に統一
- 画像をSquooshでWebP圧縮後、`flavor-images` バケットにアップロード

---

### 2026-01-15 追加: Afzalフレーバー登録
- CLOUD SHOPのafzalコレクション（1-2ページ）から29種を抽出し、Afzalブランドでシード登録
- フレーバー名から推測したタグを付与し、`image_path` を `flavors/Afzal/<FLAVOR_NAME>.webp` に統一
- 画像をSquooshでWebP圧縮後、`flavor-images` バケットにアップロード

---

### 2026-01-15 追加: TOPページの紹介デザイン
- Homeダッシュボードを刷新し、Kemurecoの紹介内容を前面に出したランディング構成へ変更
- Kaisei Decol / Zen Kaku Gothic New を用いたタイポグラフィと暖色系のビジュアルトーンを採用
- ログイン状態に応じてCTAと記録セクションを出し分け

---

### 2026-01-15 追加: ランディングページの公開
- 認証ガードの除外対象に `/` を追加し、未ログインでもランディングページを閲覧可能に変更

---

### 2026-01-15 追加: モバイル下部ナビ削除
- レイアウトから BottomNav を外し、モバイル下部ナビを表示しないように変更

---

### 2026-01-15 追加: ランディングのスクロールアニメーション
- IntersectionObserverでセクションが視界に入ったタイミングでフェード＆スライドインを適用
- `scroll-fade` ユーティリティを追加し、遅延付きで段階表示

---

### 2026-01-15 追加: ランディングのスクロール可視判定改善
- 初期表示時にビューポート内の要素を即表示する判定を追加し、PCでもアニメーションが確実に反映されるように調整

---

### 2026-01-15 追加: ランディングの初期パス判定修正
- `usePathname()` が未確定のタイミングでも `/` をガード対象外にするため、`pathname` が空のときも素通りさせるよう調整

---

### 2026-01-15 追加: ランディング表示時の認証確認を省略
- 認証ローディング中でもランディングを表示し、ログイン済みのときだけ記録セクションを表示するよう調整

---

### 2026-01-15 追加: ランディングのダークモード対応
- ランディング内の各セクションにダーク配色を追加し、背景/文字/境界色をテーマに合わせて切り替え
