
-- Delete all 1_year plans
DELETE FROM public.plans WHERE duration = '1_year';

-- Insert lifetime plans for each region
INSERT INTO public.plans (region, duration, price, currency) VALUES
  ('INDIA', 'lifetime', 4999, 'INR'),
  ('GULF_RICH', 'lifetime', 129.99, 'USD'),
  ('WEST_TIER2', 'lifetime', 99.99, 'USD'),
  ('POOR_TIER4', 'lifetime', 39.99, 'USD');

-- Update process_premium_purchase to handle lifetime
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
  v_is_lifetime BOOLEAN := false;
BEGIN
  IF p_duration = 'lifetime' THEN
    v_is_lifetime := true;
    v_days := 36500;
  ELSE
    v_days := CASE p_duration
      WHEN '1_day' THEN 1
      WHEN '1_week' THEN 7
      WHEN '1_month' THEN 30
      WHEN '6_month' THEN 180
      ELSE 30
    END;
  END IF;

  v_bonus := CASE p_duration
    WHEN '1_day' THEN 50
    WHEN '1_week' THEN 100
    WHEN '1_month' THEN 250
    WHEN '6_month' THEN 500
    WHEN 'lifetime' THEN 1000
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

  RETURN json_build_object('success', true, 'expires_at', v_new_expiry, 'coins_added', v_bonus, 'is_lifetime', v_is_lifetime);
END;
$function$;
