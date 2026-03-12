-- Create a function to check if a user is the effective host (original host or earliest joinee if host left)
CREATE OR REPLACE FUNCTION public.is_effective_host(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- If original host is still a member, only they are host
    WHEN EXISTS (
      SELECT 1 FROM room_members rm
      JOIN rooms r ON r.id = rm.room_id
      WHERE rm.room_id = p_room_id AND rm.user_id = r.host_id
    ) THEN (
      SELECT r.host_id = p_user_id FROM rooms r WHERE r.id = p_room_id
    )
    -- Otherwise, earliest joinee is host
    ELSE (
      SELECT rm.user_id = p_user_id
      FROM room_members rm
      WHERE rm.room_id = p_room_id
      ORDER BY rm.joined_at ASC
      LIMIT 1
    )
  END
$$;

-- Update "Host can kick members" policy on room_members to use effective host
DROP POLICY IF EXISTS "Host can kick members" ON public.room_members;
CREATE POLICY "Host can kick members"
ON public.room_members
FOR DELETE
TO authenticated
USING (
  is_effective_host(room_id, auth.uid())
  OR auth.uid() = user_id
);

-- Update "Host can delete their room" policy on rooms
DROP POLICY IF EXISTS "Host can delete their room" ON public.rooms;
CREATE POLICY "Host can delete their room"
ON public.rooms
FOR DELETE
TO public
USING (
  is_effective_host(id, auth.uid())
);

-- Update "Host can update their room" policy on rooms
DROP POLICY IF EXISTS "Host can update their room" ON public.rooms;
CREATE POLICY "Host can update their room"
ON public.rooms
FOR UPDATE
TO public
USING (
  is_effective_host(id, auth.uid())
);