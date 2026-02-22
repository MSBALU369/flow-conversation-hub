-- Fix: Don't set username in handle_new_user so onboarding screen activates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, coins)
  VALUES (NEW.id, 20);
  RETURN NEW;
END;
$$;