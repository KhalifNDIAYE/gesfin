-- Fix contracts table RLS: Replace overly permissive SELECT policy with permission-based access

-- Drop the overly permissive policy that allows all authenticated users to view all contracts
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON contracts;

-- Create a new policy that requires 'marches' module read permission
CREATE POLICY "Users with marches permission can view contracts"
ON contracts FOR SELECT
USING (
  has_permission(auth.uid(), 'marches'::module_name, 'read'::permission_type)
);