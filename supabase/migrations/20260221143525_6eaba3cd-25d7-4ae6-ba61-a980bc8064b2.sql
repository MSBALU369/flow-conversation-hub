-- Allow users to delete messages they sent (for clear chat feature)
CREATE POLICY "Users can delete their own sent messages"
  ON public.chat_messages
  FOR DELETE
  USING (auth.uid() = sender_id);
