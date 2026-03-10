ALTER TABLE public.affiliate_products 
ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'English',
ADD COLUMN IF NOT EXISTS target_country text NOT NULL DEFAULT 'GLOBAL';