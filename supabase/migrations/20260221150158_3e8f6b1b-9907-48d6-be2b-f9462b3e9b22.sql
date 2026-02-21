
-- 1. Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  from_user_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read);

-- 2. Create transfer_coins RPC for ACID-compliant coin transfers
CREATE OR REPLACE FUNCTION public.transfer_coins(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_coins INTEGER;
BEGIN
  -- Validate
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;
  IF p_sender_id = p_receiver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send coins to yourself');
  END IF;

  -- Lock sender row and check balance
  SELECT coins INTO v_sender_coins FROM profiles WHERE id = p_sender_id FOR UPDATE;
  IF v_sender_coins IS NULL OR v_sender_coins < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;

  -- Deduct from sender
  UPDATE profiles SET coins = coins - p_amount WHERE id = p_sender_id;
  -- Add to receiver
  UPDATE profiles SET coins = COALESCE(coins, 0) + p_amount WHERE id = p_receiver_id;

  -- Record transaction
  INSERT INTO coin_transactions (sender_id, receiver_id, amount, type, status)
  VALUES (p_sender_id, p_receiver_id, p_amount, 'send', 'completed');

  -- Create notification for receiver
  INSERT INTO notifications (user_id, type, title, message, from_user_id)
  VALUES (p_receiver_id, 'coins', 'Coins Received', p_amount || ' coins received!', p_sender_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Create function to check and expire premium
CREATE OR REPLACE FUNCTION public.check_premium_expiration(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_is_premium BOOLEAN;
BEGIN
  SELECT is_premium, premium_expires_at INTO v_is_premium, v_expires_at
  FROM profiles WHERE id = p_user_id;

  IF v_is_premium = true AND v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    UPDATE profiles SET is_premium = false WHERE id = p_user_id;
    RETURN false;
  END IF;

  RETURN COALESCE(v_is_premium, false);
END;
$$;
