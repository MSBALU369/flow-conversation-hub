
-- Add current_session_id to profiles for single-device login enforcement
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_session_id text DEFAULT NULL;
