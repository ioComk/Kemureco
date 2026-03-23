-- flavorsテーブルに日本語名カラムを追加
ALTER TABLE public.flavors ADD COLUMN IF NOT EXISTS name_ja text;

COMMENT ON COLUMN public.flavors.name_ja IS '日本語フレーバー名（検索用）';
