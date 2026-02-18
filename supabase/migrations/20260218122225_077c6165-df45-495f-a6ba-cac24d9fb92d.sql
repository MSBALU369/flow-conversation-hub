
-- Add early_end_count column to track consecutive early call endings (<1 min)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS early_end_count integer DEFAULT 0;

-- Update default coins for NEW users from 0 to 20
ALTER TABLE public.profiles ALTER COLUMN coins SET DEFAULT 20;

-- Update handle_new_user function to give 20 coins on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, username, coins)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1), 20);
  RETURN NEW;
END;
$function$;
