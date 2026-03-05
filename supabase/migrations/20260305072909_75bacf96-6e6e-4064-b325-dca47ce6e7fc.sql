
CREATE OR REPLACE FUNCTION public.log_call_for_both(
  p_caller_id uuid, 
  p_receiver_id uuid, 
  p_caller_name text, 
  p_receiver_name text, 
  p_duration integer DEFAULT 0, 
  p_status text DEFAULT 'completed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_caller_id
     AND auth.uid() IS DISTINCT FROM p_receiver_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert ONE record: user_id = caller, partner_id = receiver, use actual status
  INSERT INTO call_history (user_id, partner_id, partner_name, duration, status)
  VALUES (
    p_caller_id,
    p_receiver_id,
    p_receiver_name,
    p_duration,
    p_status
  );
END;
$$;
