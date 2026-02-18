
-- Add coins column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0;

-- Add referred_by column to profiles (stores the unique_id of the referrer)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text DEFAULT NULL;

-- Create referrals table to track who referred whom
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id),
  referred_user_id uuid NOT NULL REFERENCES public.profiles(id),
  coins_awarded boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can see their own referrals
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- System inserts referrals (via trigger)
CREATE POLICY "Allow insert for authenticated users"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_user_id OR auth.uid() = referrer_id);

-- Create a function to handle referral on signup
-- When a user sets referred_by, find the referrer and award coins
CREATE OR REPLACE FUNCTION public.handle_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_uuid uuid;
BEGIN
  -- Only process if referred_by is being set (not null) and it changed
  IF NEW.referred_by IS NOT NULL AND (OLD.referred_by IS NULL OR OLD.referred_by != NEW.referred_by) THEN
    -- Find referrer by unique_id
    SELECT id INTO referrer_uuid FROM public.profiles WHERE unique_id = NEW.referred_by;
    
    IF referrer_uuid IS NOT NULL AND referrer_uuid != NEW.id THEN
      -- Check if referral already exists
      IF NOT EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = NEW.id) THEN
        -- Insert referral record
        INSERT INTO public.referrals (referrer_id, referred_user_id, coins_awarded)
        VALUES (referrer_uuid, NEW.id, true);
        
        -- Award 10 coins to referrer
        UPDATE public.profiles SET coins = COALESCE(coins, 0) + 10 WHERE id = referrer_uuid;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_referral_set
  AFTER UPDATE OF referred_by ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral();
