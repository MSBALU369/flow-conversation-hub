
-- Fix 1: Stop storing email in profiles to prevent public exposure
-- Update handle_new_user to not set email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, coins)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1), 20);
  RETURN NEW;
END;
$$;

-- Null out all existing emails in profiles (email lives in auth.users)
UPDATE public.profiles SET email = NULL;
