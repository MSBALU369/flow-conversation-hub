
-- Drop the overly permissive public profiles policy
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;

-- Create a restricted public view policy using a security definer function
-- that returns only non-sensitive columns
CREATE OR REPLACE FUNCTION public.get_public_profile_columns()
RETURNS TABLE (
  id uuid,
  username text,
  unique_id text,
  avatar_url text,
  level integer,
  xp integer,
  streak_count integer,
  badges text[],
  gender public.gender_type,
  followers_count integer,
  following_count integer,
  is_premium boolean,
  is_online boolean,
  country text,
  region text,
  location_city text,
  description text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT 
    id, username, unique_id, avatar_url, level, xp, streak_count, badges,
    gender, followers_count, following_count, is_premium, is_online,
    country, region, location_city, description, created_at
  FROM public.profiles;
$$;

-- Re-create the public SELECT policy but restrict sensitive columns
-- Since RLS works at row level not column level, we use a view approach instead.
-- For now, replace with: authenticated users see all of own row, public sees all rows
-- but the app code must be updated to not select sensitive fields for other users.

-- Simpler approach: keep row-level access but make the policy require auth for full access
-- Public (anon) can only see profiles if authenticated
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);
