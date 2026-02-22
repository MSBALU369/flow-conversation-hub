
-- 1. Update find_match RPC to skip blocked users (both directions)
CREATE OR REPLACE FUNCTION public.find_match(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- EXCLUDE users that are blocked in either direction
  SELECT * INTO v_match FROM matchmaking_queue
  WHERE user_id != p_user_id
    AND status = 'searching'
    AND updated_at > now() - interval '15 seconds'
    -- Not blocked by the searching user
    AND NOT EXISTS (
      SELECT 1 FROM friendships
      WHERE user_id = p_user_id AND friend_id = matchmaking_queue.user_id AND status = 'blocked'
    )
    -- The other user hasn't blocked the searching user
    AND NOT EXISTS (
      SELECT 1 FROM friendships
      WHERE user_id = matchmaking_queue.user_id AND friend_id = p_user_id AND status = 'blocked'
    )
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
$function$;
