
-- Table to track permanently banned emails (can never re-register)
CREATE TABLE public.banned_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  banned_by uuid REFERENCES auth.users(id),
  reason text DEFAULT 'Banned by admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can manage banned emails
CREATE POLICY "Admins can manage banned emails"
  ON public.banned_emails FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role));

-- Add is_hidden column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;
