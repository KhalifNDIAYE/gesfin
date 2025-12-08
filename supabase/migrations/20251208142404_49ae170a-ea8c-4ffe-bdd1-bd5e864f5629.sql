-- Add mime_type column to project_documents if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_documents' AND column_name = 'mime_type') THEN
    ALTER TABLE public.project_documents ADD COLUMN mime_type text;
  END IF;
END $$;

-- Create the project-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  20971520, -- 20 MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Users with projets permission can upload project docs" ON storage.objects;
DROP POLICY IF EXISTS "Users with projets permission can view project docs" ON storage.objects;
DROP POLICY IF EXISTS "Users with projets permission can delete project docs" ON storage.objects;

-- Policy: Users with projets read permission can view/download documents
CREATE POLICY "Users with projets permission can view project docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-documents'
  AND (
    has_permission(auth.uid(), 'projets'::module_name, 'read'::permission_type)
    OR is_admin(auth.uid())
  )
);

-- Policy: Users with projets create/update permission can upload documents
CREATE POLICY "Users with projets permission can upload project docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    has_permission(auth.uid(), 'projets'::module_name, 'create'::permission_type)
    OR has_permission(auth.uid(), 'projets'::module_name, 'update'::permission_type)
    OR is_admin(auth.uid())
  )
);

-- Policy: Users with projets delete permission can delete documents
CREATE POLICY "Users with projets permission can delete project docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-documents'
  AND (
    has_permission(auth.uid(), 'projets'::module_name, 'delete'::permission_type)
    OR is_admin(auth.uid())
  )
);

-- Create function to delete project files when project is deleted
CREATE OR REPLACE FUNCTION public.delete_project_files()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all files in the project folder from storage
  DELETE FROM storage.objects 
  WHERE bucket_id = 'project-documents' 
  AND name LIKE 'projects/' || OLD.id || '/%';
  
  RETURN OLD;
END;
$$;

-- Create trigger for automatic file deletion
DROP TRIGGER IF EXISTS delete_project_files_trigger ON public.projects;
CREATE TRIGGER delete_project_files_trigger
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_project_files();