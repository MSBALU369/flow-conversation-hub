
-- Coin transactions table for Send/Request between friends
CREATE TABLE public.coin_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  receiver_id uuid NOT NULL REFERENCES public.profiles(id),
  amount integer NOT NULL CHECK (amount > 0),
  type text NOT NULL DEFAULT 'send' CHECK (type IN ('send', 'request')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.coin_transactions FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create transactions"
ON public.coin_transactions FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update transactions they received"
ON public.coin_transactions FOR UPDATE
USING (auth.uid() = receiver_id);

-- Private talent sharing permissions for premium users
CREATE TABLE public.talent_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_owner_id uuid NOT NULL REFERENCES public.profiles(id),
  friend_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(talent_owner_id, friend_id)
);

ALTER TABLE public.talent_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage talent permissions"
ON public.talent_permissions FOR ALL
USING (auth.uid() = talent_owner_id);

CREATE POLICY "Friends can view their permissions"
ON public.talent_permissions FOR SELECT
USING (auth.uid() = friend_id);
