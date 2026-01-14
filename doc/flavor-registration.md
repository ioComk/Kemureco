【目的】
入力したURLのページにあるフレーバーを、画像付きでSupabaseに登録する。

【前提】
- 画像保存先: Supabase Storageバケット `flavor-images`
- 画像の命名規則: `flavors/<BRAND_NAME>/<FLAVOR_NAME>.webp`
- 画像は @squoosh/cli でWebP圧縮してからアップロード
- `created_by` はNULL（公開フレーバー扱い）
- `LOG.md` に必ず追記
- 実装後に `http://localhost:3000` のHTTP 200確認

【入力情報】
- 対象URL: <URL>
- ブランド名: <BRAND_NAME>
- タグ指定: フレーバーの味から推測（例：Lemon juice -> tag: lemon, citrus）

【やってほしいこと】
1. URLのHTMLから商品名と画像URLを抽出（商品名は英字部分のみ）
2. 既存レコード重複を避けるシード用SQLを作成
3. 画像をダウンロード → SquooshでWebP圧縮
4. Storageへ `flavors/<BRAND_NAME>/<FLAVOR_NAME>.webp` でアップロード
5. `flavors.image_path` を上記パスに更新、`created_by = NULL` を保証
6. `LOG.md` に作業内容を追記
7. `http://localhost:3000` のHTTP 200確認

【注意】
- 既存レコードがある場合、INSERTではタグが更新されないため、必要に応じてUPDATEを用意すること
- `supabase db push` が必要なら実行（リンク済み前提）
- 何か不明なら必ず質問してから進めること
