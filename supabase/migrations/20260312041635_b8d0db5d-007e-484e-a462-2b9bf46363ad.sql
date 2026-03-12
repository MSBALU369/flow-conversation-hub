
-- Update India lifetime plan price to 2999
UPDATE public.plans SET price = 2999 WHERE duration = 'lifetime' AND region = 'INDIA';
