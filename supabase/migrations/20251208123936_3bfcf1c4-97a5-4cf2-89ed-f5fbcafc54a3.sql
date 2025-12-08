-- Create the convention-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'convention-documents',
  'convention-documents',
  false,
  20971520, -- 20 MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users with conventions permission can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users with conventions permission can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users with conventions permission can delete documents" ON storage.objects;

-- Policy: Users with conventions read permission can view/download documents
CREATE POLICY "Users with conventions permission can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'convention-documents'
  AND (
    has_permission(auth.uid(), 'conventions'::module_name, 'read'::permission_type)
    OR is_admin(auth.uid())
  )
);

-- Policy: Users with conventions create/update permission can upload documents
CREATE POLICY "Users with conventions permission can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'convention-documents'
  AND (
    has_permission(auth.uid(), 'conventions'::module_name, 'create'::permission_type)
    OR has_permission(auth.uid(), 'conventions'::module_name, 'update'::permission_type)
    OR is_admin(auth.uid())
  )
);

-- Policy: Users with conventions delete permission can delete documents
CREATE POLICY "Users with conventions permission can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'convention-documents'
  AND (
    has_permission(auth.uid(), 'conventions'::module_name, 'delete'::permission_type)
    OR is_admin(auth.uid())
  )
);