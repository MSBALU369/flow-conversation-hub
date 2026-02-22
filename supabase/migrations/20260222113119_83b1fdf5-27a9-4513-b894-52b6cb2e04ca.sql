
-- Step 1: Add preference columns to matchmaking_queue
ALTER TABLE public.matchmaking_queue
  ADD COLUMN IF NOT EXISTS gender_preference text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS level_preference text DEFAULT NULL;

-- Step 2: Rewrite find_match with bilateral logic + premium verification
CREATE OR REPLACE FUNCTION public.find_match(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_room_id TEXT;
  v_existing RECORD;
  v_my_gender text;
  v_my_level int;
  v_my_is_premium boolean;
  v_my_gender_pref text;
  v_my_level_pref text;
BEGIN
  -- Check if already matched
  SELECT * INTO v_existing FROM matchmaking_queue WHERE user_id = p_user_id AND status = 'matched';
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'matched', 'room_id', v_existing.room_id, 'matched_with', v_existing.matched_with);
  END IF;

  -- Fetch caller's profile attributes
  SELECT gender::text, level, COALESCE(is_premium, false)
    INTO v_my_gender, v_my_level, v_my_is_premium
    FROM profiles WHERE id = p_user_id;

  -- Read caller's queue preferences
  SELECT gender_preference, level_preference
    INTO v_my_gender_pref, v_my_level_pref
    FROM matchmaking_queue WHERE user_id = p_user_id;

  -- SECURITY: If not premium, forcefully clear preferences
  IF NOT v_my_is_premium THEN
    v_my_gender_pref := NULL;
    v_my_level_pref := NULL;
    UPDATE matchmaking_queue SET gender_preference = NULL, level_preference = NULL WHERE user_id = p_user_id;
  END IF;

  -- Upsert into queue as searching (preserve preferences)
  INSERT INTO matchmaking_queue (user_id, status, updated_at, gender_preference, level_preference)
  VALUES (p_user_id, 'searching', now(), v_my_gender_pref, v_my_level_pref)
  ON CONFLICT (user_id) DO UPDATE SET status = 'searching', updated_at = now();

  -- Try to find a bilateral match
  SELECT mq.* INTO v_match FROM matchmaking_queue mq
  JOIN profiles p ON p.id = mq.user_id
  WHERE mq.user_id != p_user_id
    AND mq.status = 'searching'
    AND mq.updated_at > now() - interval '15 seconds'
    -- Not blocked in either direction
    AND NOT EXISTS (
      SELECT 1 FROM friendships
      WHERE user_id = p_user_id AND friend_id = mq.user_id AND status = 'blocked'
    )
    AND NOT EXISTS (
      SELECT 1 FROM friendships
      WHERE user_id = mq.user_id AND friend_id = p_user_id AND status = 'blocked'
    )
    -- BILATERAL CHECK 1: My gender preference must match their actual gender
    AND (v_my_gender_pref IS NULL OR lower(v_my_gender_pref) = 'random' OR lower(p.gender::text) = lower(v_my_gender_pref))
    -- BILATERAL CHECK 2: Their gender preference must match MY actual gender
    AND (mq.gender_preference IS NULL OR lower(mq.gender_preference) = 'random' OR lower(v_my_gender::text) = lower(mq.gender_preference))
    -- BILATERAL CHECK 3: My level preference must match their level
    AND (
      v_my_level_pref IS NULL OR v_my_level_pref = 'Any'
      OR (v_my_level_pref = '1-5' AND p.level BETWEEN 1 AND 5)
      OR (v_my_level_pref = '6-10' AND p.level BETWEEN 6 AND 10)
      OR (v_my_level_pref = '11-20' AND p.level BETWEEN 11 AND 20)
      OR (v_my_level_pref = '21+' AND p.level >= 21)
    )
    -- BILATERAL CHECK 4: Their level preference must match MY level
    AND (
      mq.level_preference IS NULL OR mq.level_preference = 'Any'
      OR (mq.level_preference = '1-5' AND v_my_level BETWEEN 1 AND 5)
      OR (mq.level_preference = '6-10' AND v_my_level BETWEEN 6 AND 10)
      OR (mq.level_preference = '11-20' AND v_my_level BETWEEN 11 AND 20)
      OR (mq.level_preference = '21+' AND v_my_level >= 21)
    )
  ORDER BY mq.created_at ASC
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

-- Step 3: Create a join_matchmaking RPC that stores preferences with premium verification
CREATE OR REPLACE FUNCTION public.join_matchmaking(p_user_id uuid, p_gender_pref text DEFAULT NULL, p_level_pref text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_is_premium boolean;
  v_gender_pref text := p_gender_pref;
  v_level_pref text := p_level_pref;
BEGIN
  -- Premium verification: strip preferences for free users
  SELECT COALESCE(is_premium, false) INTO v_is_premium FROM profiles WHERE id = p_user_id;
  IF NOT v_is_premium THEN
    v_gender_pref := NULL;
    v_level_pref := NULL;
  END IF;

  INSERT INTO matchmaking_queue (user_id, status, updated_at, gender_preference, level_preference)
  VALUES (p_user_id, 'searching', now(), v_gender_pref, v_level_pref)
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'searching',
        updated_at = now(),
        room_id = NULL,
        matched_with = NULL,
        gender_preference = v_gender_pref,
        level_preference = v_level_pref;
END;
$$;
