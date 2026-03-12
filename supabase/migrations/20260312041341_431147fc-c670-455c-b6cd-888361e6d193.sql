
-- Step 1: Add 'lifetime' to plan_duration enum (must be committed alone)
ALTER TYPE public.plan_duration ADD VALUE IF NOT EXISTS 'lifetime';
