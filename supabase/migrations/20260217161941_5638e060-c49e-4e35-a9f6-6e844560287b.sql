
-- Add is_private column to talent_uploads
ALTER TABLE public.talent_uploads ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Drop existing SELECT policy
DROP POLICY "Anyone can view talent uploads" ON public.talent_uploads;

-- Public talents visible to all, private only to owner
CREATE POLICY "Users can view public talents or their own"
ON public.talent_uploads FOR SELECT
USING (is_private = false OR auth.uid() = user_id);
