-- Fix journal_entries table RLS: Replace overly permissive SELECT policy with permission-based access

-- Drop the overly permissive policy that allows all authenticated users to view all journal entries
DROP POLICY IF EXISTS "Authenticated users can view journal entries" ON journal_entries;

-- Create a new policy that requires 'comptabilite' module read permission
CREATE POLICY "Users with comptabilite permission can view journal entries"
ON journal_entries FOR SELECT
USING (
  has_permission(auth.uid(), 'comptabilite'::module_name, 'read'::permission_type)
);