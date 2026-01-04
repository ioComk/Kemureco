-- Add grams column to mix_components table
ALTER TABLE public.mix_components 
ADD COLUMN IF NOT EXISTS grams numeric(10,2) DEFAULT NULL;

COMMENT ON COLUMN public.mix_components.grams IS 'Weight in grams for the flavor component';

