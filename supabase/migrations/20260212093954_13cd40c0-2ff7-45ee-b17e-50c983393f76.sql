-- Add policy allowing authenticated users to view basic profile info
-- This is required for user selection dropdowns (project assignment, etc.)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');