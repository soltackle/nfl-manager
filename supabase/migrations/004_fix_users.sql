-- Fix missing users who registered without a username or due to trigger errors

-- 1. Insert missing users from auth.users into public.users
INSERT INTO public.users (id, email, username)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'username', 'Manager_' || substr(id::text, 1, 6))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

-- 2. Update the trigger to prevent future failures
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', 'Manager_' || substr(new.id::text, 1, 6))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
