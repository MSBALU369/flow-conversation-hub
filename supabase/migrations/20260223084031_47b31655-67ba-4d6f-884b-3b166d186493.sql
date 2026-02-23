
-- Add reactions column to chat_messages (JSONB: {"👍": ["user_id1"], "❤️": ["user_id2"]})
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;
