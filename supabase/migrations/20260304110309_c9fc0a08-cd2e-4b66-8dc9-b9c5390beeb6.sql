-- Fix infinite recursion in room_members/rooms RLS by using a SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members rm
    WHERE rm.room_id = p_room_id
      AND rm.user_id = p_user_id
  );
$$;

-- Room members: safe SELECT policy (no self-referencing query in policy body)
DROP POLICY IF EXISTS "Members can view room members" ON public.room_members;
CREATE POLICY "Members can view room members"
ON public.room_members
FOR SELECT
USING (public.is_room_member(room_id, auth.uid()));

-- Rooms: safe SELECT policy using helper function instead of direct room_members subquery
DROP POLICY IF EXISTS "Anyone can view public rooms" ON public.rooms;
CREATE POLICY "Anyone can view public rooms"
ON public.rooms
FOR SELECT
USING (
  (is_private = false)
  OR (host_id = auth.uid())
  OR public.is_room_member(id, auth.uid())
);

-- Optional hardening: room_messages policies also use helper for consistency/performance
DROP POLICY IF EXISTS "Members can view room messages" ON public.room_messages;
CREATE POLICY "Members can view room messages"
ON public.room_messages
FOR SELECT
USING (public.is_room_member(room_id, auth.uid()));

DROP POLICY IF EXISTS "Members can send messages" ON public.room_messages;
CREATE POLICY "Members can send messages"
ON public.room_messages
FOR INSERT
WITH CHECK ((auth.uid() = sender_id) AND public.is_room_member(room_id, auth.uid()));