
-- Allow admin/root to delete any talent_upload
CREATE POLICY "Admins can delete any talent"
ON public.talent_uploads
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role)
);

-- Allow admin/root to update any talent_upload (for hiding)
CREATE POLICY "Admins can update any talent"
ON public.talent_uploads
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role)
);

-- Allow admin/root to delete any room
CREATE POLICY "Admins can delete any room"
ON public.rooms
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role)
);

-- Allow admin/root to update any room (for hiding)
CREATE POLICY "Admins can update any room"
ON public.rooms
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role)
);

-- Allow admin/root to delete room_members for any room (needed for room cleanup)
CREATE POLICY "Admins can delete any room members"
ON public.room_members
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role)
);

-- Allow admin/root to view all talent_uploads (including private)
CREATE POLICY "Admins can view all talents"
ON public.talent_uploads
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role)
);

-- Allow admin/root to update any profile (for ban/hide/etc)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'root'::app_role)
);
