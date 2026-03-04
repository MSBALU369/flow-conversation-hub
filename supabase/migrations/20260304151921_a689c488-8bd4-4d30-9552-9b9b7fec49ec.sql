
-- Allow hosts to kick (delete) members from their rooms
CREATE POLICY "Host can kick members"
ON public.room_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_id AND r.host_id = auth.uid()
  )
);
