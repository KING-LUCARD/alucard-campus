-- Usernames for sign-in. Email stays the verified delivery address for the sign-up OTP.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (lower(username));

-- Same sign-up trigger as 0002_school_portals (owner auto-approved as admin, others pending), plus the username.
CREATE OR REPLACE FUNCTION public.create_school_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE wanted text := lower(coalesce(NEW.raw_user_meta_data->>'username',''));
BEGIN
  IF wanted !~ '^[a-z0-9_]{3,20}$' THEN wanted := NULL; END IF;
  INSERT INTO public.profiles(id,display_name,email,status,username) VALUES(NEW.id,left(coalesce(NEW.raw_user_meta_data->>'display_name',''),100),coalesce(NEW.email,''), CASE WHEN lower(NEW.email)='desdara247@gmail.com' THEN 'approved' ELSE 'pending' END, wanted);
  IF lower(NEW.email)='desdara247@gmail.com' THEN
    INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'admin') ON CONFLICT (user_id,role) DO UPDATE SET active=true;
  ELSIF NEW.raw_user_meta_data->>'requested_role' IN ('student','teacher') THEN
    INSERT INTO public.role_requests(user_id,requested_role) VALUES(NEW.id,(NEW.raw_user_meta_data->>'requested_role')::public.app_role);
  END IF;
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'username_taken';
END $$;
