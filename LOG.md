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

---

### 2026-01-15 追加: 認証ページのデザイン仕様追記
- ランディングと整合するログイン/サインアップ画面の仕様を `doc/specification.md` に追加
- 2カラム構成、暖色系トーン、Kaisei Decol / Zen Kaku Gothic New を前提に整理

---

### 2026-01-15 追加: 実装用仕様書の追加ルール
- 実装用の仕様書は `doc/frontend` と `doc/backend` に分離して作成する方針を採用
- 認証画面の実装仕様を `doc/frontend/auth-screen.md` として追加

---

### 2026-01-15 追加: 認証UX改善と規約ページの下地追加
- `doc/frontend/auth-screen.md` にUX改善項目と規約/プライバシーリンク要件を追記
- 認証フォームにパスワード表示切替、インラインエラー、Magic Link送信後の案内を追加
- 利用規約/プライバシーポリシーのドラフトページを `/terms` と `/privacy` に追加

---

### 2026-01-15 追加: 規約文言の確定とリンク設置
- `/terms` と `/privacy` の文言をドラフトから確定版へ更新
- フッターとモバイルナビに規約/プライバシーへのリンクを追加

---

### 2026-01-15 追加: 公開ページの認証ガード除外
- `/terms` と `/privacy` を認証ガードの除外対象に追加

---

### 2026-01-15 追加: 全体デザイン仕様の追加
- 全体のデザイントーンとコンポーネント指針を `doc/frontend/design-guidelines.md` に整理
- 規約/プライバシーのカードは枠線を抑え、影で面を表現する方針に調整

---

### 2026-01-15 追加: カレンダー日付詳細のUI/UX仕様
- カレンダー日付クリック時の詳細ビュー仕様を `doc/specification.md` に追加
- PCはDialog、SPはDrawer/Bottom Sheetで表示する方針を明記
- サマリーと記録一覧の情報優先度、空/読み込み/エラー状態を整理

---

### 2026-01-15 追加: カレンダー日付詳細仕様の分離
- `doc/specification.md` から日付詳細の仕様を削除し、`doc/frontend/session-day-detail.md` に移動

---

### 2026-01-15 追加: 日付詳細仕様のアイデア追記
- `doc/frontend/session-day-detail.md` に日内タイムラインやクイック絞り込み等の検討案を追加

---

### 2026-01-15 追加: 日付詳細仕様の改良
- `doc/frontend/session-day-detail.md` にデザイン方針、主要コンポーネント、カード構成、モーション方針を追記

---

### 2026-01-15 追加: 日付詳細モーダルの実装改良
- `src/components/sessions/home-sessions-calendar.tsx` の日付詳細UIをサマリー/一覧/メモの構成に刷新
- 空状態でも日付詳細を開けるようにし、記録追加CTAを常時表示
- 共有メニューにX投稿/リンクコピーを集約し、コピー時のトーストを追加

---

### 2026-01-15 追加: セッションカード右上メニュー
- 日付詳細のセッションカード右上に三点リーダーのメニューを配置

---

### 2026-01-15 追加: 三点リーダーのアイコン調整
- セッションカード右上のメニューアイコンをEllipsisに変更

---

### 2026-01-15 追加: メニューを編集・削除に限定
- セッションカードのメニューを右上の縦三点に変更し、編集/削除のみ表示

---

### 2026-01-15 追加: 日付詳細ヘッダーのメニュー化
- 日付詳細右上の「記録追加」ボタンを縦三点メニューに変更し、編集/削除を表示

---

### 2026-01-15 追加: ヘッダーメニューの横三点化
- 日付詳細ヘッダーのメニューアイコンを横三点に変更

---

### 2026-01-15 追加: カードメニューの横三点化
- セッションカード右上のメニューアイコンを横三点に統一

---

### 2026-01-15 追加: 共有機能の復帰
- セッションカードのメニューにX投稿とリンクコピーを復帰

---

### 2026-01-15 追加: 日付詳細のレスポンシブ調整
- 日付詳細モーダルの幅/余白/スクロール高をモバイル向けに調整

---

### 2026-01-15 追加: モーダルの高さ最適化
- 日付詳細モーダルを最大90vhに抑え、内部スクロールで画面内に収める調整を実施

---

### 2026-01-15 追加: 仕様書の作成ルール更新
- 各ページの仕様書を `doc/frontend/<page>.md` と `doc/backend/<page>.md` のセットで作成する方針に統一
- 仕様変更は両方に反映し、`LOG.md` に記録するルールを明記

---

### 2026-01-15 追加: 仕様書の統合ルールへ変更
- 各ページの仕様書は `doc/<page>.md` にフロント/バックを統合して記述する方針に修正

---

### 2026-01-15 追加: DOZAJ BLACK フレーバー登録（DBのみ反映）
- ASLAJの DOZAJ BLACK ページから 38 フレーバーを抽出し、`supabase/migrations/20260115150000_dozaj_black_flavors_seed.sql` を作成して適用
- WebP 画像は `/tmp/dozaj-black/webp-q75` に生成済み、StorageアップロードはRLSで停止（サービスロールキー待ち）
- 画像アップロード用に `scripts/upload-dozaj-black-images.js` を追加

---

### 2026-01-15 追加: DOZAJ BLACK 画像アップロード完了
- `flavor-images` に 38 件アップロードし、全フレーバーの `image_path` を更新

---

### 2026-01-18 追加: コミット・プッシュ運用ルールの文書化
- 実装完了後の確認事項とコミット・プッシュ手順を `doc/commit-push.md` に作成

---

### 2026-01-18 追加: Cloudflare ビルド確認の追加
- `npm run build:cf` 成功を push 前の必須確認に追加

---

### 2026-01-18 追加: デザインガイドラインのレスポンシブ仕様
- `doc/frontend/design-guidelines.md` にレスポンシブ対応の指針を追記

---

### 2026-01-18 追加: コミット前のモバイル確認追加
- `doc/commit-push.md` にモバイル端末での表示・操作確認を必須項目として追記

---

### 2026-01-18 追加: モバイルのFlavors遷移導線修正
- ヘッダーのNavMenuがモバイルで表示されるようにラッパー条件を修正
- モバイル用のボトムナビゲーションを `RootLayout` に追加

---

### 2026-01-18 追加: ログイン後の遷移先変更
- 認証完了時の自動遷移先を `/sessions` に変更

---

### 2026-01-18 追加: ログイン済みのランディング回避
- `/` にアクセスしてもログイン済みなら `/sessions` へ自動遷移するよう `HomeDashboard` にリダイレクトを追加

---

### 2026-01-18 追加: モバイルのボトムナビ廃止
- `RootLayout` から `BottomNav` のレンダリングを削除

---

### 2026-01-18 追加: セッション日付詳細の配合表示簡素化
- 配合グラフ表示を廃止し、フレーバー名と画像の並びのみ表示するよう更新
- 仕様書 `doc/frontend/session-day-detail.md` のミックス表示方針を更新

---

### 2026-01-18 追加: /auth のビルド失敗回避
- `/auth` ページをクライアント専用レンダリングにして、ビルド時にSupabase環境変数が無い場合でも失敗しないよう調整

---

### 2026-01-18 追加: /auth のプリレンダー抑止
- `/auth` を `force-dynamic` にしてビルド時のプリレンダーを回避

---

### 2026-01-18 追加: /auth のEdge Runtime指定
- Cloudflare Pages の要件に合わせて `/auth` に `runtime = "edge"` を追加

---

### 2026-01-27 追加: ホームのカード可読性とタブレット配置調整
- ホームヒーローのノート行を縦並び対応にし、狭幅時の折返しと可読性を改善
- 特徴カードを `md` で2列表示にしてタブレットでの余白過多を軽減

---

### 2026-01-27 追加: フレーバー画面の表記統一
- フレーバー一覧の英語UIラベルを日本語へ統一（グループ化、もっと見る等）
- /flavors のローディング文言を日本語化

---

### 2026-01-27 追加: セッション記録フォームのモバイル調整
- /sessions/new の送信ボタンをモバイルで全幅化し、下部余白を確保
- 記録フォーム内の英語プレースホルダを日本語例へ統一

---

### 2026-01-27 追加: 自由入力フレーバーの表示改善
- セッション一覧・カレンダーで自由入力フレーバーを抽出し、「未設定」表示を回避

---

### 2026-01-27 追加: セッション記録の合計グラム非表示
- セッション詳細サマリーでグラム未入力時は「合計グラム」カード自体を表示しないよう変更

---

### 2026-01-27 追加: 自由入力フレーバーのグラム非表示
- 自由入力フレーバーの末尾グラム表記（例: (3g)）を表示から除去
- セッション詳細のメモ表示で「自由入力フレーバー:」行を除外し、ラベル表記も簡素化

---

### 2026-01-27 追加: セッション詳細の使用フレーバーアイコン
- セッション詳細サマリーの「合計グラム」を廃止し、使用フレーバーの丸アイコンを表示
- 画像がないフレーバーはグレーのプレースホルダー表示、ホバーで名称を確認可能

---

### 2026-01-27 追加: フレーバーアイコンのshadcnツールチップ
- セッション詳細の使用フレーバーアイコンをTooltipでホバー表示に変更
- shadcn/ui Tooltipコンポーネントを追加

---

### 2026-01-27 追加: Tooltip依存追加
- shadcn/ui Tooltipで必要な `@radix-ui/react-tooltip` をdependenciesに追加

---

### 2026-01-27 追加: セッション詳細のメモカード削除とボタン配置
- 「この日のメモ」カードを削除
- 「次のアクション」見出しを削除し、「この日に記録を追加」ボタンをカード最下部で全幅表示

---

### 2026-01-27 追加: セッション詳細の1カラム化
- フレーバー/場所の詳細を全幅表示に変更
- 追加ボタンを詳細の下に全幅で配置

---

### 2026-01-27 追加: セッション編集の自由入力フレーバー対応
- 編集モードで自由入力フレーバーを別入力欄で編集できるようにし、保存時に notes に反映
- メモ欄は自由入力フレーバー行を除外して編集できるように変更

---

### 2026-01-27 追加: セッション編集のフレーバー入力統一
- セッション詳細の編集モードで、登録フォームと同じカード/タブ形式でフレーバーを編集できるように変更
- 自由入力は専用入力に統合し、保存時の notes 形式を登録時と同じに整形

---

### 2026-01-27 追加: 自由入力フレーバー区切りの明確化
- 自由入力フレーバーの保存形式を「ブランド / フレーバー名」に統一してスペースを含むブランドに対応
- 旧形式（スペース区切り）も読み取り可能にし、表示時はスラッシュを除去して出力
- セッション詳細の編集キャンセル時に未定義の状態更新を呼ばないよう修正

---

### 2026-01-27 追加: 自由入力フレーバー旧形式の扱い見直し
- 区切り記号がない自由入力フレーバーはブランドを推測せず、名称として扱う方針に変更

---

### 2026-01-27 追加: カレンダー詳細の追加ボタン固定表示
- セッションが複数ある日でも「この日に記録を追加」ボタンが見えるよう、一覧をflexカラム＋下部配置に変更

---

### 2026-01-27 追加: カレンダー詳細の追加ボタン固定
- 記録一覧スクロール時でも常に見えるよう、追加ボタンカードをsticky bottom配置に変更

---

### 2026-01-27 追加: セッション詳細スクロール修正
- ダイアログ高さを90vh固定し、内部をScrollAreaでスクロール可能に変更
- 一覧部分のScrollAreaネストを解消してスクロールを一本化

---

### 2026-01-27 追加: セッション詳細のJSX閉じタグ修正
- Dialogヘッダー領域の閉じタグを補正し、スクロール領域の構造を正しく修正

---

### 2026-01-27 追加: セッション詳細のScrollAreaネスト修正
- ScrollArea内のdiv階層を整理し、閉じタグ不整合を解消

---

### 2026-01-27 追加: セッション詳細のScrollArea閉じタグ補正
- ScrollArea内のラッパーdivを閉じてJSX構文エラーを解消

---

### 2026-01-27 追加: カレンダー詳細ダイアログの閉じタグ整理
- DialogContent直前の余分な閉じdivを削除し、JSX構文エラーを解消

---

### 2026-01-28 追加: SEBERO BLACK フレーバー登録
- 公式コレクション2ページから35件抽出し、英名ベースで登録
- 画像を取得して @squoosh/cli (Node24対策のpreload付き) でWebP化し、Storage `flavor-images` に `flavors/SEBERO BLACK/<name>.webp` でアップロード
- 追加マイグレーション: `supabase/migrations/20260128123000_sebero_black_flavors_seed.sql`
- タグは名称から推測し、曖昧なものは `mix` 扱い（Western / TOP / Nitro）

---

### 2026-01-28 追加: SEBERO フレーバー登録
- https://sebero.ru からBasic Collection / Limited Edition / Arctic Mixの全66種類を抽出
- ロシア語フレーバー名を英語に翻訳して登録（58種類、重複を除外）
- 画像をダウンロードし、sharp (quality 85, effort 6) でWebP圧縮
- Storage `flavor-images` に `flavors/SEBERO/<name>.webp` でアップロード
- 追加マイグレーション: `supabase/migrations/20260128130000_sebero_flavors_seed.sql`
- タグはフレーバー説明から推測（トロピカル / ベリー / ミント / デザート / ハーブ等）
- Supabase CLI v2.72.7 に更新してStorage API互換性問題を解決
- マイグレーション適用後、`http://localhost:3000` でHTTP 200確認
