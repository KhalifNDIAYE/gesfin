-- Fix: Restrict profiles table access to own profile for regular users, all for admins

-- Drop existing overly permissive SELECT policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Create proper scoped SELECT policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (is_admin(auth.uid()));

-- Create a limited view for user dropdowns (only exposes id and full_name)
-- This allows features like assignment dropdowns without exposing PII
CREATE OR REPLACE VIEW public.user_names AS
SELECT 
  id,
  full_name
FROM profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.user_names TO authenticated;