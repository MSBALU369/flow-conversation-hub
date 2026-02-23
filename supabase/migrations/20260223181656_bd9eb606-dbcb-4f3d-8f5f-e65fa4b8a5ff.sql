
-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'payment',
  status TEXT NOT NULL DEFAULT 'open',
  admin_note TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'root'::app_role)
);

CREATE POLICY "Admins can update tickets"
ON public.support_tickets FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'root'::app_role)
);

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Admin force-grant premium + bonus coins
CREATE OR REPLACE FUNCTION public.admin_grant_premium(
  p_target_user_id UUID,
  p_duration_days INTEGER DEFAULT 30,
  p_bonus_coins INTEGER DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_expiry TIMESTAMP WITH TIME ZONE;
  v_current_coins INTEGER;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'root'::app_role)
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_new_expiry := now() + (p_duration_days || ' days')::INTERVAL;
  SELECT COALESCE(coins, 0) INTO v_current_coins FROM profiles WHERE id = p_target_user_id;

  UPDATE profiles SET
    is_premium = true,
    premium_expires_at = v_new_expiry,
    coins = v_current_coins + p_bonus_coins,
    badges = array_append(COALESCE(badges, ARRAY[]::text[]), 'premium')
  WHERE id = p_target_user_id;

  UPDATE profiles SET badges = (
    SELECT ARRAY(SELECT DISTINCT unnest(badges))
  ) WHERE id = p_target_user_id;

  INSERT INTO coin_transactions (sender_id, receiver_id, amount, type, status)
  VALUES (p_target_user_id, p_target_user_id, p_bonus_coins, 'premium_bonus', 'completed');

  RETURN json_build_object('success', true, 'expires_at', v_new_expiry, 'coins_added', p_bonus_coins);
END;
$$;

-- Process premium purchase (webhook simulation)
CREATE OR REPLACE FUNCTION public.process_premium_purchase(
  p_user_id UUID,
  p_duration TEXT,
  p_bonus_coins INTEGER DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER;
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

  v_new_expiry := now() + (v_days || ' days')::INTERVAL;
  SELECT COALESCE(coins, 0) INTO v_current_coins FROM profiles WHERE id = p_user_id;

  UPDATE profiles SET
    is_premium = true,
    premium_expires_at = v_new_expiry,
    coins = v_current_coins + p_bonus_coins,
    badges = array_append(COALESCE(badges, ARRAY[]::text[]), 'premium')
  WHERE id = p_user_id;

  UPDATE profiles SET badges = (
    SELECT ARRAY(SELECT DISTINCT unnest(badges))
  ) WHERE id = p_user_id;

  INSERT INTO coin_transactions (sender_id, receiver_id, amount, type, status)
  VALUES (p_user_id, p_user_id, p_bonus_coins, 'premium_bonus', 'completed');

  RETURN json_build_object('success', true, 'expires_at', v_new_expiry, 'coins_added', p_bonus_coins);
END;
$$;

-- Enable realtime for support_tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
