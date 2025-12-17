-- Fix expense-attachments storage policies with proper owner-based access control
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload expense attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view expense attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete expense attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_upload_expense_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_view_expense_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_delete_expense_attachments" ON storage.objects;

-- Create new owner-based policies for expense-attachments bucket
-- Users can only upload to their own folder (user_id/filename pattern)
CREATE POLICY "Users can upload their own expense attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'expense-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own attachments OR users with comptabilite read permission OR admins
CREATE POLICY "Users can view expense attachments with permission"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'expense-attachments' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_permission(auth.uid(), 'comptabilite'::module_name, 'read'::permission_type)
    OR is_admin(auth.uid())
  )
);

-- Users can update their own attachments OR users with comptabilite update permission OR admins
CREATE POLICY "Users can update their own expense attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'expense-attachments' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_permission(auth.uid(), 'comptabilite'::module_name, 'update'::permission_type)
    OR is_admin(auth.uid())
  )
);

-- Users can delete their own attachments OR users with comptabilite delete permission OR admins
CREATE POLICY "Users can delete their own expense attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'expense-attachments' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_permission(auth.uid(), 'comptabilite'::module_name, 'delete'::permission_type)
    OR is_admin(auth.uid())
  )
);