
-- Ghost Mode for Premium users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_ghost_mode boolean DEFAULT false;

-- Status/Mood message (short text under avatar)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_message text DEFAULT '';

-- Pinned messages in chat
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Profile views tracking
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id uuid NOT NULL,
  viewed_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile views"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = viewed_user_id);

CREATE POLICY "Authenticated users can insert profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Simple unique constraint (one view per viewer per viewed user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_views_unique
  ON public.profile_views (viewer_id, viewed_user_id);

-- GDPR: Delete account function
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.chat_messages WHERE sender_id = p_user_id OR receiver_id = p_user_id;
  DELETE FROM public.coin_transactions WHERE sender_id = p_user_id OR receiver_id = p_user_id;
  DELETE FROM public.friendships WHERE user_id = p_user_id OR friend_id = p_user_id;
  DELETE FROM public.call_history WHERE user_id = p_user_id;
  DELETE FROM public.calls WHERE caller_id = p_user_id OR receiver_id = p_user_id;
  DELETE FROM public.matches WHERE user1_id = p_user_id OR user2_id = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.reports WHERE reporter_id = p_user_id OR reported_user_id = p_user_id;
  DELETE FROM public.referrals WHERE referrer_id = p_user_id OR referred_user_id = p_user_id;
  DELETE FROM public.talent_likes WHERE user_id = p_user_id;
  DELETE FROM public.talent_uploads WHERE user_id = p_user_id;
  DELETE FROM public.talent_permissions WHERE talent_owner_id = p_user_id OR friend_id = p_user_id;
  DELETE FROM public.muted_users WHERE user_id = p_user_id OR muted_user_id = p_user_id;
  DELETE FROM public.room_members WHERE user_id = p_user_id;
  DELETE FROM public.matchmaking_queue WHERE user_id = p_user_id;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.profile_views WHERE viewer_id = p_user_id OR viewed_user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
