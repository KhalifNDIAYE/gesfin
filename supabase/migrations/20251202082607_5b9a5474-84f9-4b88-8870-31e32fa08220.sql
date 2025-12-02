
-- Update handle_new_user to auto-assign admin role to first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_count INTEGER;
  _admin_role_id UUID;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Check if this is the first user
  SELECT COUNT(*) INTO _user_count FROM public.profiles;
  
  IF _user_count = 1 THEN
    -- Get admin role id
    SELECT id INTO _admin_role_id FROM public.roles WHERE name = 'admin';
    
    -- Assign admin role to first user
    IF _admin_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (NEW.id, _admin_role_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
