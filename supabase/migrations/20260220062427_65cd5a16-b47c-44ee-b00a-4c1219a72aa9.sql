
CREATE OR REPLACE FUNCTION public.check_reference_id(ref_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE unique_id = ref_id
  );
$$;
