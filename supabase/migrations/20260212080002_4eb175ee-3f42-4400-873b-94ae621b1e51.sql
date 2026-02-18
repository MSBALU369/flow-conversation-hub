
-- Create rooms table
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code text NOT NULL UNIQUE,
  title text NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'English',
  host_id uuid NOT NULL REFERENCES public.profiles(id),
  max_members integer NOT NULL DEFAULT 12,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create room_members table
CREATE TABLE public.room_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create room_messages table
CREATE TABLE public.room_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Anyone can view public rooms" ON public.rooms
  FOR SELECT USING (is_private = false OR EXISTS (
    SELECT 1 FROM public.room_members rm WHERE rm.room_id = rooms.id AND rm.user_id = auth.uid()
  ) OR host_id = auth.uid());

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their room" ON public.rooms
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Host can delete their room" ON public.rooms
  FOR DELETE USING (auth.uid() = host_id);

-- Room members policies
CREATE POLICY "Members can view room members" ON public.room_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.room_members rm2 WHERE rm2.room_id = room_members.room_id AND rm2.user_id = auth.uid()
  ));

CREATE POLICY "Users can join rooms" ON public.room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.room_members
  FOR DELETE USING (auth.uid() = user_id);

-- Room messages policies
CREATE POLICY "Members can view room messages" ON public.room_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_messages.room_id AND rm.user_id = auth.uid()
  ));

CREATE POLICY "Members can send messages" ON public.room_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_messages.room_id AND rm.user_id = auth.uid()
  ));

-- Enable realtime for room_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
