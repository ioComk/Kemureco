# フレーバー登録手順書

## 目的

入力したURLのページにあるフレーバーを、画像付きでSupabaseに登録する。
統合スクリプト `scripts/register-flavors.mjs` で大部分を自動化している。

---

## 前提条件

- Node.js 18+
- `sharp` がインストール済み（`npm install -D sharp`）
- `.env.local` に以下が設定済み:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Supabase Storageバケット `flavor-images` が存在
- 画像命名規則: `flavors/<BRAND_NAME>/<FLAVOR_NAME>.webp`
- `created_by` は NULL（公開フレーバー扱い）

---

## クイックスタート（対応サイトの場合）

対応サイトなら1コマンドで完了する:

```bash
node scripts/register-flavors.mjs \
  --url "https://example.com/category/brand" \
  --brand "BRAND_NAME" \
  --migration
```

### 対応サイト

| サイト | ドメイン | 例 |
|--------|----------|-----|
| ASLAJ | aslaj.com | `https://www.aslaj.com/view/category/ct112` |
| NEWEMO SHISHA | newemoshisha.com | `https://newemoshisha.com/collections/vendors?q=dozaj` |
| Adalya公式 | adalyatobacco.com | `https://www.adalyatobacco.com/tr/adalya` |

### オプション一覧

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--url <URL>` | 対象ページのURL | 必須* |
| `--brand <BRAND>` | ブランド名 | 必須 |
| `--json <FILE>` | 事前抽出済みJSONファイル | 必須*（`--url`と排他） |
| `--dry-run` | 実行内容の表示のみ | false |
| `--skip-images` | 画像処理をスキップ | false |
| `--skip-db` | DB操作をスキップ | false |
| `--output <DIR>` | 画像出力先 | `tmp/<brand>` |
| `--migration` | SQLマイグレーション生成 | false |
| `--quality <N>` | WebP品質 (0-100) | 85 |

---

## Claude Code 向け手順（標準ワークフロー）

ユーザーからURL + ブランド名を受け取ったら、以下の手順で実行する。

### ステップ1: ドライランで確認

```bash
node scripts/register-flavors.mjs \
  --url "<URL>" \
  --brand "<BRAND_NAME>" \
  --dry-run
```

- 抽出されたフレーバー名とタグを確認
- 問題があれば修正が必要（→ ステップ2へ）
- 問題なければステップ3へ

### ステップ2: 未対応サイトの場合（JSON入力）

対応サイト以外や、汎用パーサーで正しく抽出できない場合:

1. URLのHTMLを取得して目視確認
2. フレーバー名・画像URL・タグを手動抽出
3. JSONファイルを作成:

```json
[
  {
    "name": "Flavor Name",
    "imageUrl": "https://example.com/image.jpg",
    "tags": ["tag1", "tag2"]
  }
]
```

4. JSONモードで実行:

```bash
node scripts/register-flavors.mjs \
  --json tmp/flavors.json \
  --brand "<BRAND_NAME>" \
  --dry-run
```

### ステップ3: 本番実行

```bash
node scripts/register-flavors.mjs \
  --url "<URL>" \
  --brand "<BRAND_NAME>" \
  --migration
```

実行内容:
1. HTMLからフレーバー名と画像URLを抽出
2. タグをフレーバー名から自動推定
3. 画像をダウンロード → sharp で WebP 変換（quality 85, effort 6）
4. `brands` テーブルに upsert
5. `flavors` テーブルに INSERT（重複チェック付き）+ UPDATE（既存レコードのタグ・画像パス更新）
6. `flavor-images` バケットに WebP 画像をアップロード
7. SQLマイグレーションファイルを `supabase/migrations/` に生成

### ステップ4: 後処理

```bash
# アプリの動作確認
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# LOG.md に追記（以下のテンプレートを使用）
```

LOG.md追記テンプレート:

```markdown
### YYYY-MM-DD: <BRAND_NAME> フレーバー登録
- 対象URL: <URL>
- 登録数: N フレーバー（新規: X, 更新: Y）
- 画像: WebP (quality 85) → Supabase Storage `flavor-images`
- マイグレーション: `YYYYMMDDHHMMSS_<brand>_flavors_seed.sql`
```

---

## タグ推定ルール

スクリプトはフレーバー名からキーワードベースでタグを自動推定する。
推定精度が不十分な場合は、JSONで明示的にタグを指定すること。

### 主要タグカテゴリ

| カテゴリ | タグ例 |
|---------|--------|
| フルーツ | apple, banana, cherry, grape, lemon, mango, melon, orange, peach, pineapple |
| ベリー | blueberry, raspberry, strawberry, blackberry, currant, berry |
| ミント・クール | mint, menthol, ice, cool |
| ハーブ・スパイス | basil, cinnamon, thyme, ginger, herbal, spice |
| デザート | vanilla, chocolate, cream, caramel, cookie, honey, bubblegum, candy |
| ドリンク | cola, coffee, tea, milk, soda, mojito |
| フローラル | rose, jasmine, lavender, floral |
| その他 | tobacco, forest, wood, nut, corn, cucumber |
| カテゴリ | tropical, citrus, dessert, savory |

### 除外ルール（誤判定防止）

- `grape` → `grapefruit` を含む場合はスキップ
- `apple` → `pineapple` を含む場合はスキップ
- `mint` → `supermint` を含む場合はスキップ
- `berry` → 具体的なベリー名を含む場合はスキップ
- `melon` → `watermelon` を含む場合はスキップ

---

## データ規約

| 項目 | 規約 |
|------|------|
| ブランド名 | 公式表記（大文字/公式ケーシング） |
| フレーバー名 | 英字のみ（日本語・ロシア語等は英訳） |
| created_by | NULL（公開シードデータ） |
| image_path | `flavors/<BRAND>/<FLAVOR_NAME>.webp` |
| 画像形式 | WebP (quality 85, effort 6) |
| マイグレーション命名 | `YYYYMMDDHHMMSS_<brand>_flavors_seed.sql` |
| タグ | 小文字英語、複数語はスペース区切り（例: `passion fruit`） |

---

## トラブルシューティング

### `sharp が見つかりません`

```bash
npm install -D sharp
```

### 汎用パーサーで抽出できない

→ JSON入力モードを使用（ステップ2参照）

### 画像URLが相対パスで失敗する

→ JSONで絶対URLを指定するか、ブラウザDevToolsで正しいURLを確認

### DB操作が権限エラーになる

→ `.env.local` の `SUPABASE_SERVICE_ROLE_KEY` を確認。anon keyでは管理操作不可

### 既存フレーバーのタグが更新されない

→ スクリプトは既存レコードのUPDATEも自動実行する。マイグレーションSQL内にもUPDATE文を含む

---

## 注意事項

- 既存レコードがある場合、スクリプトは自動でUPDATE（タグ・画像パス・created_by）を実行する
- `supabase db push` が必要なら実行（リンク済み前提）
- 何か不明なら必ず質問してから進めること
- `LOG.md` に作業内容を必ず追記すること
