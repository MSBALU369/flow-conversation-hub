
CREATE OR REPLACE FUNCTION public.sync_test_role()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_role app_role := NULL;
  v_is_premium boolean := false;
  v_premium_expires_at timestamptz := NULL;
  v_coins int := NULL;
  v_num int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('matched', false);
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('matched', false);
  END IF;

  v_email := lower(trim(v_email));

  -- Admin: balumothe+test1-6@gmail.com
  IF v_email ~ '^balumothe\+test([0-9]+)@gmail\.com$' THEN
    v_num := (regexp_match(v_email, '\+test([0-9]+)@'))[1]::int;
    IF v_num >= 1 AND v_num <= 6 THEN
      v_role := 'admin';
      v_coins := 5000;
      IF v_num <= 3 THEN
        v_is_premium := true;
        v_premium_expires_at := now() + interval '100 years';
      END IF;
    END IF;

  -- Root: balushinu+test1-8@gmail.com
  ELSIF v_email ~ '^balushinu\+test([0-9]+)@gmail\.com$' THEN
    v_num := (regexp_match(v_email, '\+test([0-9]+)@'))[1]::int;
    IF v_num >= 1 AND v_num <= 8 THEN
      v_role := 'root';
      v_coins := 3000;
      IF v_num <= 4 THEN
        v_is_premium := true;
        v_premium_expires_at := now() + interval '2 years';
      END IF;
    END IF;

  -- Master: baludev324+test1-10@gmail.com
  ELSIF v_email ~ '^baludev324\+test([0-9]+)@gmail\.com$' THEN
    v_num := (regexp_match(v_email, '\+test([0-9]+)@'))[1]::int;
    IF v_num >= 1 AND v_num <= 10 THEN
      v_role := 'master';
      v_coins := 2000;
      IF v_num <= 4 THEN
        v_is_premium := true;
        v_premium_expires_at := now() + interval '2 years';
      END IF;
    END IF;

  -- Node: baludev24+test1-14@gmail.com
  ELSIF v_email ~ '^baludev24\+test([0-9]+)@gmail\.com$' THEN
    v_num := (regexp_match(v_email, '\+test([0-9]+)@'))[1]::int;
    IF v_num >= 1 AND v_num <= 14 THEN
      v_role := 'node';
      v_coins := 1000;
      IF v_num <= 6 THEN
        v_is_premium := true;
        v_premium_expires_at := now() + interval '1 year';
      END IF;
    END IF;

  -- Test: allytgroup123+test1-16@gmail.com
  ELSIF v_email ~ '^allytgroup123\+test([0-9]+)@gmail\.com$' THEN
    v_num := (regexp_match(v_email, '\+test([0-9]+)@'))[1]::int;
    IF v_num >= 1 AND v_num <= 16 THEN
      v_role := 'test';
      v_coins := 500;
      IF v_num <= 8 THEN
        v_is_premium := true;
        v_premium_expires_at := now() + interval '1 year';
      END IF;
    END IF;
  END IF;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('matched', false);
  END IF;

  -- Delete existing roles for this user then insert the new one
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, v_role);

  -- Update premium status and coins on profiles
  UPDATE public.profiles
  SET is_premium = v_is_premium,
      premium_expires_at = v_premium_expires_at,
      coins = v_coins
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'matched', true,
    'role', v_role::text,
    'is_premium', v_is_premium,
    'premium_expires_at', v_premium_expires_at,
    'coins', v_coins
  );
END;
$$;
