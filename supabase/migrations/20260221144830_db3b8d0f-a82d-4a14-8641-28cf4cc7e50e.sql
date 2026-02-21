
-- Create chat_media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_media', 'chat_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat_media
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat_media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view chat media (public bucket)
CREATE POLICY "Chat media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat_media');

-- Allow users to delete their own chat media
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat_media' AND auth.uid()::text = (storage.foldername(name))[1]);
