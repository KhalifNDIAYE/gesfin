-- Expose only non-sensitive branding info (name/logo/favicon) for unauthenticated pages (e.g., /auth)
-- This keeps organization_settings as the single source of truth while allowing the login screen + favicon to render.

CREATE OR REPLACE FUNCTION public.get_public_branding()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'name', os.name,
    'logo_url', os.logo_url,
    'favicon_url', os.favicon_url,
    'updated_at', os.updated_at
  )
  INTO result
  FROM public.organization_settings os
  ORDER BY os.updated_at DESC NULLS LAST, os.created_at DESC NULLS LAST
  LIMIT 1;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_branding() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branding() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_branding() TO authenticated;
