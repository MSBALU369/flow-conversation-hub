
-- 1. Create muted_users table for persistent mute state
CREATE TABLE public.muted_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  muted_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, muted_user_id)
);

ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mutes"
  ON public.muted_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mute others"
  ON public.muted_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmute"
  ON public.muted_users FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Create premium_content table for dynamic books/courses
CREATE TABLE public.premium_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'book', -- 'book' or 'course'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Premium content is publicly readable"
  ON public.premium_content FOR SELECT
  USING (true);

-- Seed with initial content
INSERT INTO public.premium_content (title, author, category, url, type) VALUES
  ('Think and Grow Rich', 'Napoleon Hill', 'Motivational', 'https://www.amazon.com/dp/0449214923', 'book'),
  ('Atomic Habits', 'James Clear', 'Self-Help', 'https://www.amazon.com/dp/0735211299', 'book'),
  ('The Power of Now', 'Eckhart Tolle', 'Motivational', 'https://www.amazon.com/dp/1577314808', 'book'),
  ('English Grammar in Use', 'Raymond Murphy', 'English', 'https://www.amazon.com/dp/1108457657', 'book'),
  ('English Speaking Masterclass', 'Udemy', 'English', 'https://www.udemy.com', 'course'),
  ('IELTS Preparation', 'Coursera', 'English', 'https://www.coursera.org', 'course'),
  ('Public Speaking Skills', 'Skillshare', 'Communication', 'https://www.skillshare.com', 'course'),
  ('Business English', 'LinkedIn Learning', 'Professional', 'https://www.linkedin.com/learning', 'course');
