-- Fix SECURITY DEFINER view issue by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS public.user_names;

CREATE VIEW public.user_names 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name
FROM profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.user_names TO authenticated;