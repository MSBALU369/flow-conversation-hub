
-- Add last_seen timestamp to profiles for offline presence display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Add reply_to_id to chat_messages for swipe-to-reply threading
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL;
