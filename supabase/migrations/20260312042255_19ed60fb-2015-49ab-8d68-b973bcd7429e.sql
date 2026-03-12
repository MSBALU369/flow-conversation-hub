-- Delete all lifetime plans
DELETE FROM public.plans WHERE duration = 'lifetime';

-- Insert 1_year plans for all regions
INSERT INTO public.plans (region, duration, price, currency) VALUES
  ('INDIA', '1_year', 2999, 'INR'),
  ('GULF_RICH', '1_year', 79.99, 'USD'),
  ('WEST_TIER2', '1_year', 59.99, 'USD'),
  ('POOR_TIER4', '1_year', 24.99, 'USD');

-- Update process_premium_purchase to handle 1_year instead of lifetime
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

  v_bonus := CASE p_duration
    WHEN '1_day' THEN 50
    WHEN '1_week' THEN 100
    WHEN '1_month' THEN 250
    WHEN '6_month' THEN 500
    WHEN '1_year' THEN 1000
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