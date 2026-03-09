
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_change_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS password_last_changed timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hidden_talents uuid[] DEFAULT '{}';
