-- Auto-promote the project owner to admin on signup, so no manual SQL is needed after registering.
-- (Replaces the manual "update public.users set role='admin' where email='soltackle0@gmail.com'" step.)
-- Keeps the security hardening from 20260625013836 (SECURITY DEFINER + pinned search_path).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', 'Manager_' || substr(new.id::text, 1, 6))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Bootstrap the project owner as admin automatically.
  IF new.email = 'soltackle0@gmail.com' THEN
    UPDATE public.users SET role = 'admin' WHERE id = new.id;
  END IF;

  RETURN new;
END;
$function$;
