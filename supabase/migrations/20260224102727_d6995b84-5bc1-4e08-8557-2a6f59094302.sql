CREATE OR REPLACE FUNCTION public.log_call_for_both(
  p_caller_id UUID,
  p_receiver_id UUID,
  p_caller_name TEXT,
  p_receiver_name TEXT,
  p_duration INT DEFAULT 0,
  p_status TEXT DEFAULT 'completed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_caller_id
     AND auth.uid() IS DISTINCT FROM p_receiver_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO call_history (user_id, partner_name, duration, status)
  VALUES (
    p_caller_id,
    p_receiver_name,
    p_duration,
    CASE WHEN p_status = 'missed' THEN 'missed' ELSE 'outgoing' END
  );

  INSERT INTO call_history (user_id, partner_name, duration, status)
  VALUES (
    p_receiver_id,
    p_caller_name,
    p_duration,
    CASE WHEN p_status = 'missed' THEN 'missed' ELSE 'incoming' END
  );
END;
$$;