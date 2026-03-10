
-- Replace overly permissive UPDATE policy with a function-based approach
DROP POLICY IF EXISTS "Users can increment clicks" ON public.affiliate_products;

-- Create a secure function to increment clicks
CREATE OR REPLACE FUNCTION public.increment_affiliate_click(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliate_products
  SET clicks_count = clicks_count + 1
  WHERE id = p_product_id;
END;
$$;
