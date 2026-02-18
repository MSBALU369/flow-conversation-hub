-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create gender enum
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'unknown');

-- Create region enum for pricing tiers
CREATE TYPE public.region_tier AS ENUM ('INDIA', 'GULF_RICH', 'WEST_TIER2', 'POOR_TIER4');

-- Create plan duration enum
CREATE TYPE public.plan_duration AS ENUM ('1_day', '1_week', '1_month', '6_month', '1_year');

-- Create profiles table (User Master Record)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  unique_id TEXT UNIQUE DEFAULT CONCAT('EF', UPPER(SUBSTRING(gen_random_uuid()::text, 1, 10))),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_online BOOLEAN DEFAULT false,
  
  -- Smart Energy
  energy_bars INTEGER DEFAULT 5 CHECK (energy_bars >= 0 AND energy_bars <= 5),
  last_refill_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Gamification
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  
  -- Safety Trap
  reports_count INTEGER DEFAULT 0,
  wrong_gender_reports INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  gender_locked BOOLEAN DEFAULT false,
  gender public.gender_type DEFAULT 'unknown',
  
  -- Social
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  
  -- Premium
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Location
  country TEXT,
  region TEXT
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create plans table (Global Pricing Strategy)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region public.region_tier NOT NULL,
  duration public.plan_duration NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(region, duration)
);

-- Enable RLS on plans (public read)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable"
ON public.plans FOR SELECT
USING (true);

-- Insert pricing data
INSERT INTO public.plans (region, duration, price, currency) VALUES
-- INDIA (Tier 3) - INR
('INDIA', '1_day', 49, 'INR'),
('INDIA', '1_week', 199, 'INR'),
('INDIA', '1_month', 399, 'INR'),
('INDIA', '6_month', 1999, 'INR'),
('INDIA', '1_year', 2999, 'INR'),
-- GULF_RICH (Tier 1) - USD
('GULF_RICH', '1_day', 1.49, 'USD'),
('GULF_RICH', '1_week', 4.99, 'USD'),
('GULF_RICH', '1_month', 9.99, 'USD'),
('GULF_RICH', '6_month', 49.99, 'USD'),
('GULF_RICH', '1_year', 79.99, 'USD'),
-- WEST_TIER2 - USD
('WEST_TIER2', '1_day', 0.99, 'USD'),
('WEST_TIER2', '1_week', 3.99, 'USD'),
('WEST_TIER2', '1_month', 7.99, 'USD'),
('WEST_TIER2', '6_month', 39.99, 'USD'),
('WEST_TIER2', '1_year', 59.99, 'USD'),
-- POOR_TIER4 - USD
('POOR_TIER4', '1_day', 0.29, 'USD'),
('POOR_TIER4', '1_week', 1.49, 'USD'),
('POOR_TIER4', '1_month', 2.99, 'USD'),
('POOR_TIER4', '6_month', 14.99, 'USD'),
('POOR_TIER4', '1_year', 24.99, 'USD');

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

-- Create matches table (call history)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  energy_deducted BOOLEAN DEFAULT false
);

-- Enable RLS on matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
ON public.matches FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert matches"
ON public.matches FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own matches"
ON public.matches FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create user_roles table for admin functionality
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;