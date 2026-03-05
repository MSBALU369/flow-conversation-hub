
-- Add partner_id column to call_history so both users can see the same record
ALTER TABLE public.call_history ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.profiles(id);

-- Drop old restrictive RLS policies
DROP POLICY IF EXISTS "Users can view their own call history" ON public.call_history;
DROP POLICY IF EXISTS "Users can insert their own call history" ON public.call_history;
DROP POLICY IF EXISTS "Users can delete their own call history" ON public.call_history;

-- New RLS: both caller (user_id) and receiver (partner_id) can see the record
CREATE POLICY "Users can view their call history"
ON public.call_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Only the system (via security definer RPC) inserts
CREATE POLICY "Users can insert call history"
ON public.call_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Both can delete their own view (optional, keep for cleanup)
CREATE POLICY "Users can delete their call history"
ON public.call_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Update the log_call_for_both function to insert ONE record per call
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

  -- Insert ONE record: user_id = caller, partner_id = receiver
  INSERT INTO call_history (user_id, partner_id, partner_name, duration, status)
  VALUES (
    p_caller_id,
    p_receiver_id,
    p_receiver_name,
    p_duration,
    'completed'
  );
END;
$$;
