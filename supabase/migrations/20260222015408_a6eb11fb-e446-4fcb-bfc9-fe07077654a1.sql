
-- Add columns for message editing and deletion
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_for text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean DEFAULT false;

-- Update RLS: allow sender to also update their own messages (for editing/deleting)
DROP POLICY IF EXISTS "Users can update their own messages (mark as read)" ON public.chat_messages;

CREATE POLICY "Users can update their own messages" 
ON public.chat_messages 
FOR UPDATE 
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));
