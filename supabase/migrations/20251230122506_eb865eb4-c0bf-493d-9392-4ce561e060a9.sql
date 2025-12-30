-- Fix the log_organization_change function to use correct module name
CREATE OR REPLACE FUNCTION public.log_organization_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_action TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  IF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
    
    -- Log the change with correct module name 'parametres' (not 'parametrage')
    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      module
    ) VALUES (
      v_user_id,
      v_user_email,
      v_action,
      'organization_settings',
      NEW.id::TEXT,
      v_old_values,
      v_new_values,
      'parametres'
    );
  END IF;
  
  RETURN NEW;
END;
$$;