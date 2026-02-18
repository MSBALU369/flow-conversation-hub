-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS battery_bars integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS location_city text,
ADD COLUMN IF NOT EXISTS last_username_change timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_avatar_change timestamp with time zone;

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Friendships RLS policies
CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendship status"
ON public.friendships FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  media_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages RLS policies
CREATE POLICY "Users can view their own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages (mark as read)"
ON public.chat_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Create calls table (enhanced version of call_history)
CREATE TABLE IF NOT EXISTS public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  duration_sec integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'ended', 'missed', 'declined')),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Calls RLS policies
CREATE POLICY "Users can view their own calls"
ON public.calls FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create calls"
ON public.calls FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their calls"
ON public.calls FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Create talent_uploads table
CREATE TABLE IF NOT EXISTS public.talent_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  language text NOT NULL DEFAULT 'english',
  title text,
  description text,
  likes_count integer NOT NULL DEFAULT 0,
  plays_count integer NOT NULL DEFAULT 0,
  duration_sec integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on talent_uploads
ALTER TABLE public.talent_uploads ENABLE ROW LEVEL SECURITY;

-- Talent uploads RLS policies
CREATE POLICY "Anyone can view talent uploads"
ON public.talent_uploads FOR SELECT
USING (true);

CREATE POLICY "Users can upload their own talent"
ON public.talent_uploads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own talent"
ON public.talent_uploads FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own talent"
ON public.talent_uploads FOR DELETE
USING (auth.uid() = user_id);

-- Create talent_likes table for tracking who liked what
CREATE TABLE IF NOT EXISTS public.talent_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talent_uploads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(talent_id, user_id)
);

-- Enable RLS on talent_likes
ALTER TABLE public.talent_likes ENABLE ROW LEVEL SECURITY;

-- Talent likes RLS policies
CREATE POLICY "Anyone can view talent likes"
ON public.talent_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like talent"
ON public.talent_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike talent"
ON public.talent_likes FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for friendships updated_at
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;