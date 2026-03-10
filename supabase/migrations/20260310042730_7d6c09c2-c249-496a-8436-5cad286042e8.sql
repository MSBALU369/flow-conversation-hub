
-- Affiliate Products table for monetization
CREATE TABLE public.affiliate_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'book',
  subcategory text NOT NULL DEFAULT 'English',
  cover_url text NOT NULL DEFAULT '',
  affiliate_link text NOT NULL DEFAULT '',
  is_free boolean NOT NULL DEFAULT false,
  clicks_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Affiliate products are publicly readable"
  ON public.affiliate_products FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage affiliate products"
  ON public.affiliate_products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'root'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'root'::app_role));

-- Anyone authenticated can increment clicks
CREATE POLICY "Users can increment clicks"
  ON public.affiliate_products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
