-- Create call_history table for logging calls
CREATE TABLE IF NOT EXISTS public.call_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL DEFAULT 'Anonymous',
  duration INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'outgoing' CHECK (status IN ('incoming', 'outgoing', 'missed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on call_history
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own call history
CREATE POLICY "Users can view their own call history"
  ON public.call_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own call history
CREATE POLICY "Users can insert their own call history"
  ON public.call_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own call history
CREATE POLICY "Users can delete their own call history"
  ON public.call_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_call_history_user_id ON public.call_history(user_id);
CREATE INDEX idx_call_history_created_at ON public.call_history(created_at DESC);