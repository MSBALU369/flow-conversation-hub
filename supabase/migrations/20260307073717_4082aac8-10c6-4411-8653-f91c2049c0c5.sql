
-- 1. Update handle_referral() to award +50 coins instead of +10
CREATE OR REPLACE FUNCTION public.handle_referral()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referrer_uuid uuid;
BEGIN
  IF NEW.referred_by IS NOT NULL AND (OLD.referred_by IS NULL OR OLD.referred_by != NEW.referred_by) THEN
    SELECT id INTO referrer_uuid FROM public.profiles WHERE unique_id = NEW.referred_by;
    
    IF referrer_uuid IS NOT NULL AND referrer_uuid != NEW.id THEN
      IF NOT EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = NEW.id) THEN
        INSERT INTO public.referrals (referrer_id, referred_user_id, coins_awarded)
        VALUES (referrer_uuid, NEW.id, true);
        
        -- Award 50 coins to referrer (was 10)
        UPDATE public.profiles SET coins = COALESCE(coins, 0) + 50 WHERE id = referrer_uuid;

        -- Log the referral bonus
        INSERT INTO public.coin_transactions (sender_id, receiver_id, amount, type, status)
        VALUES (referrer_uuid, referrer_uuid, 50, 'referral_bonus', 'completed');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Update process_premium_purchase with tiered bonus coins
CREATE OR REPLACE FUNCTION public.process_premium_purchase(p_user_id uuid, p_duration text, p_bonus_coins integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_days INTEGER;
  v_bonus INTEGER;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
  v_current_coins INTEGER;
BEGIN
  v_days := CASE p_duration
    WHEN '1_day' THEN 1
    WHEN '1_week' THEN 7
    WHEN '1_month' THEN 30
    WHEN '6_month' THEN 180
    WHEN '1_year' THEN 365
    ELSE 30
  END;

  -- Tiered bonus coins based on duration
  v_bonus := CASE p_duration
    WHEN '1_day' THEN 50
    WHEN '1_week' THEN 100
    WHEN '1_month' THEN 250
    WHEN '6_month' THEN 500
    WHEN '1_year' THEN 500
    ELSE 50
  END;

  v_new_expiry := now() + (v_days || ' days')::INTERVAL;
  SELECT COALESCE(coins, 0) INTO v_current_coins FROM profiles WHERE id = p_user_id;

  UPDATE profiles SET
    is_premium = true,
    premium_expires_at = v_new_expiry,
    coins = v_current_coins + v_bonus,
    badges = array_append(COALESCE(badges, ARRAY[]::text[]), 'premium')
  WHERE id = p_user_id;

  UPDATE profiles SET badges = (
    SELECT ARRAY(SELECT DISTINCT unnest(badges))
  ) WHERE id = p_user_id;

  INSERT INTO coin_transactions (sender_id, receiver_id, amount, type, status)
  VALUES (p_user_id, p_user_id, v_bonus, 'premium_bonus', 'completed');

  RETURN json_build_object('success', true, 'expires_at', v_new_expiry, 'coins_added', v_bonus);
END;
$function$;

-- 3. Update admin_grant_premium to also use tiered bonuses
CREATE OR REPLACE FUNCTION public.admin_grant_premium(p_target_user_id uuid, p_duration_days integer DEFAULT 30, p_bonus_coins integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_expiry TIMESTAMP WITH TIME ZONE;
  v_current_coins INTEGER;
  v_bonus INTEGER;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'root'::app_role)
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Tiered bonus based on duration days
  v_bonus := CASE
    WHEN p_bonus_coins > 0 THEN p_bonus_coins
    WHEN p_duration_days <= 1 THEN 50
    WHEN p_duration_days <= 7 THEN 100
    WHEN p_duration_days <= 30 THEN 250
    WHEN p_duration_days <= 180 THEN 500
    ELSE 500
  END;

  v_new_expiry := now() + (p_duration_days || ' days')::INTERVAL;
  SELECT COALESCE(coins, 0) INTO v_current_coins FROM profiles WHERE id = p_target_user_id;

  UPDATE profiles SET
    is_premium = true,
    premium_expires_at = v_new_expiry,
    coins = v_current_coins + v_bonus,
    badges = array_append(COALESCE(badges, ARRAY[]::text[]), 'premium')
  WHERE id = p_target_user_id;

  UPDATE profiles SET badges = (
    SELECT ARRAY(SELECT DISTINCT unnest(badges))
  ) WHERE id = p_target_user_id;

  INSERT INTO coin_transactions (sender_id, receiver_id, amount, type, status)
  VALUES (p_target_user_id, p_target_user_id, v_bonus, 'premium_bonus', 'completed');

  RETURN json_build_object('success', true, 'expires_at', v_new_expiry, 'coins_added', v_bonus);
END;
$function$;

-- 4. Create reward_call_coins function for daily call rewards
CREATE OR REPLACE FUNCTION public.reward_call_coins(p_user_id uuid, p_duration_seconds integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today_earned INTEGER;
  v_coins_to_award INTEGER;
  v_current_coins INTEGER;
BEGIN
  -- Only award if call >= 10 minutes (600 seconds)
  IF p_duration_seconds < 600 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'call_too_short');
  END IF;

  -- Check how many call_reward coins earned today
  SELECT COALESCE(SUM(amount), 0) INTO v_today_earned
  FROM coin_transactions
  WHERE sender_id = p_user_id
    AND receiver_id = p_user_id
    AND type = 'call_reward'
    AND created_at >= date_trunc('day', now());

  -- Max 20 coins per day
  IF v_today_earned >= 20 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_limit_reached', 'earned_today', v_today_earned);
  END IF;

  -- Award 5 coins (but don't exceed daily cap)
  v_coins_to_award := LEAST(5, 20 - v_today_earned);

  SELECT COALESCE(coins, 0) INTO v_current_coins FROM profiles WHERE id = p_user_id FOR UPDATE;

  UPDATE profiles SET coins = v_current_coins + v_coins_to_award WHERE id = p_user_id;

  INSERT INTO coin_transactions (sender_id, receiver_id, amount, type, status)
  VALUES (p_user_id, p_user_id, v_coins_to_award, 'call_reward', 'completed');

  RETURN jsonb_build_object('success', true, 'coins_awarded', v_coins_to_award, 'earned_today', v_today_earned + v_coins_to_award);
END;
$function$;
