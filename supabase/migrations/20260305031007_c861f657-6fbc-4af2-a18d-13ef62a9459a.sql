-- Update default max_members to 20
ALTER TABLE public.rooms ALTER COLUMN max_members SET DEFAULT 20;

-- Add media_url column to room_messages for image/media sharing
ALTER TABLE public.room_messages ADD COLUMN IF NOT EXISTS media_url text DEFAULT NULL;