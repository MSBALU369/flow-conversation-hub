
-- Matchmaking queue table
CREATE TABLE public.matchmaking_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'searching',
  room_id TEXT,
  matched_with UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- RLS: users can see/manage their own entry
CREATE POLICY "Users can view their queue entry" ON public.matchmaking_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their queue entry" ON public.matchmaking_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their queue entry" ON public.matchmaking_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their queue entry" ON public.matchmaking_queue FOR DELETE USING (auth.uid() = user_id);

-- Atomic matchmaking function (uses SECURITY DEFINER to update both users)
CREATE OR REPLACE FUNCTION public.find_match(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_room_id TEXT;
  v_existing RECORD;
BEGIN
  -- Check if already matched
  SELECT * INTO v_existing FROM matchmaking_queue WHERE user_id = p_user_id AND status = 'matched';
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'matched', 'room_id', v_existing.room_id, 'matched_with', v_existing.matched_with);
  END IF;

  -- Upsert into queue as searching
  INSERT INTO matchmaking_queue (user_id, status, updated_at)
  VALUES (p_user_id, 'searching', now())
  ON CONFLICT (user_id) DO UPDATE SET status = 'searching', updated_at = now(), room_id = NULL, matched_with = NULL;

  -- Try to find another actively searching user (updated within last 15 seconds)
  SELECT * INTO v_match FROM matchmaking_queue
  WHERE user_id != p_user_id
    AND status = 'searching'
    AND updated_at > now() - interval '15 seconds'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'searching');
  END IF;

  -- Generate shared room ID
  v_room_id := 'room_' || gen_random_uuid()::text;

  -- Update both users atomically
  UPDATE matchmaking_queue SET status = 'matched', room_id = v_room_id, matched_with = v_match.user_id WHERE user_id = p_user_id;
  UPDATE matchmaking_queue SET status = 'matched', room_id = v_room_id, matched_with = p_user_id WHERE user_id = v_match.user_id;

  RETURN jsonb_build_object('status', 'matched', 'room_id', v_room_id, 'matched_with', v_match.user_id);
END;
$$;

-- Leave matchmaking function
CREATE OR REPLACE FUNCTION public.leave_matchmaking(p_user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM matchmaking_queue WHERE user_id = p_user_id;
$$;
