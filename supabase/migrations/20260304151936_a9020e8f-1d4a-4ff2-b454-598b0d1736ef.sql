
-- Allow any authenticated user to find a room by room_code (needed for joining by code)
-- Drop the existing restrictive SELECT policy and replace with one that allows code lookup
DROP POLICY IF EXISTS "Anyone can view public rooms" ON public.rooms;

CREATE POLICY "Authenticated users can view rooms"
ON public.rooms
FOR SELECT
TO authenticated
USING (true);
