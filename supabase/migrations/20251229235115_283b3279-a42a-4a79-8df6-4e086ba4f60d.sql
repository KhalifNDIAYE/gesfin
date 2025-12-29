-- Add new columns to organization_settings
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS acronym TEXT,
ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Create storage bucket for organization assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-assets',
  'organization-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for organization assets
CREATE POLICY "Organization assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-assets');

CREATE POLICY "Authenticated users can upload organization assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-assets');

CREATE POLICY "Authenticated users can update organization assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-assets');

CREATE POLICY "Authenticated users can delete organization assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'organization-assets');

-- Function to log organization changes
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
    
    -- Log the change
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
      'parametrage'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for organization changes audit
DROP TRIGGER IF EXISTS trigger_log_organization_change ON public.organization_settings;
CREATE TRIGGER trigger_log_organization_change
  AFTER UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_organization_change();