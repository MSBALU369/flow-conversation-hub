CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latest_version text NOT NULL DEFAULT '1.0.0',
  min_required_version text NOT NULL DEFAULT '1.0.0',
  store_url text NOT NULL DEFAULT 'https://play.google.com',
  update_message text NOT NULL DEFAULT 'A new version of English Flow is available! Upgrade for new features.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "App settings are publicly readable"
  ON public.app_settings FOR SELECT
  USING (true);

-- Only admins/root can update
CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role));

-- Only admins can insert (for initial seed)
CREATE POLICY "Admins can insert app settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role));