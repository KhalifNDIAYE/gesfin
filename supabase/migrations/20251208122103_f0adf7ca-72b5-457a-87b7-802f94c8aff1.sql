-- Create table for document metadata
CREATE TABLE public.convention_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.convention_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for convention_documents table
CREATE POLICY "Users with read permission can see documents"
ON public.convention_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
    AND p.module = 'conventions'
    AND p.permission IN ('read', 'create', 'update', 'delete')
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Users with update permission can insert documents"
ON public.convention_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
    AND p.module = 'conventions'
    AND p.permission IN ('update', 'create')
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Users with delete permission can delete documents"
ON public.convention_documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
    AND p.module = 'conventions'
    AND p.permission = 'delete'
  )
  OR is_admin(auth.uid())
);

-- Function to log document actions
CREATE OR REPLACE FUNCTION public.log_document_action(
  _action TEXT,
  _document_id UUID,
  _convention_id UUID,
  _file_name TEXT,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email TEXT;
BEGIN
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    module,
    resource_type,
    resource_id,
    new_values
  ) VALUES (
    _user_id,
    _user_email,
    _action,
    'conventions',
    'convention_document',
    _document_id::text,
    jsonb_build_object(
      'convention_id', _convention_id,
      'file_name', _file_name
    )
  );
END;
$$;

-- Trigger to log document uploads
CREATE OR REPLACE FUNCTION public.trigger_log_document_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_document_action('document_uploaded', NEW.id, NEW.convention_id, NEW.file_name, NEW.uploaded_by);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_document_upload
AFTER INSERT ON public.convention_documents
FOR EACH ROW
EXECUTE FUNCTION trigger_log_document_upload();

-- Trigger to log document deletions
CREATE OR REPLACE FUNCTION public.trigger_log_document_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_document_action('document_deleted', OLD.id, OLD.convention_id, OLD.file_name);
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_document_delete
BEFORE DELETE ON public.convention_documents
FOR EACH ROW
EXECUTE FUNCTION trigger_log_document_delete();

-- Create index for faster lookups
CREATE INDEX idx_convention_documents_convention_id ON public.convention_documents(convention_id);

-- Storage policies for convention-documents bucket
CREATE POLICY "Users can view convention documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'convention-documents'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
      AND p.module = 'conventions'
      AND p.permission IN ('read', 'create', 'update', 'delete')
    )
    OR is_admin(auth.uid())
  )
);

CREATE POLICY "Users can upload convention documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'convention-documents'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
      AND p.module = 'conventions'
      AND p.permission IN ('update', 'create')
    )
    OR is_admin(auth.uid())
  )
);

CREATE POLICY "Users can delete convention documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'convention-documents'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
      AND p.module = 'conventions'
      AND p.permission = 'delete'
    )
    OR is_admin(auth.uid())
  )
);