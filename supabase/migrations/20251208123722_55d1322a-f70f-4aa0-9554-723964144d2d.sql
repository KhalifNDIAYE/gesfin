-- Fix: Restrict third_parties read access to users with relevant module permissions
-- This prevents any authenticated user from viewing all supplier contact information

DROP POLICY IF EXISTS "Authenticated users can view third parties" ON third_parties;

CREATE POLICY "Users with relevant permissions can view third parties"
ON third_parties FOR SELECT
USING (
  has_permission(auth.uid(), 'comptabilite'::module_name, 'read'::permission_type)
  OR has_permission(auth.uid(), 'conventions'::module_name, 'read'::permission_type)
  OR has_permission(auth.uid(), 'marches'::module_name, 'read'::permission_type)
  OR is_admin(auth.uid())
);