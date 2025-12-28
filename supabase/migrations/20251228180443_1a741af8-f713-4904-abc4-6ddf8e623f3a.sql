-- =============================================
-- MOTEUR DOCUMENTAIRE CENTRALISÉ
-- =============================================

-- 1. Créer le type enum pour les types d'entités
DO $$ BEGIN
  CREATE TYPE document_entity_type AS ENUM ('project', 'convention', 'contract', 'budget', 'expense', 'asset');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Créer le type enum pour les catégories de documents
DO $$ BEGIN
  CREATE TYPE document_category AS ENUM ('contract', 'budget', 'annex', 'report', 'invoice', 'correspondence', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Créer la table centrale des documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type document_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  category document_category NOT NULL DEFAULT 'other',
  description TEXT,
  checksum TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_is_active ON public.documents(is_active);

-- 5. Activer RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 6. Politique de lecture - utilisateurs authentifiés
CREATE POLICY "Authenticated users can view documents"
  ON public.documents
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- 7. Politique d'insertion - utilisateurs avec permissions
CREATE POLICY "Users with permissions can upload documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Politique de mise à jour - utilisateurs avec permissions
CREATE POLICY "Users with permissions can update documents"
  ON public.documents
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 9. Politique de suppression - utilisateurs avec permissions
CREATE POLICY "Users with permissions can delete documents"
  ON public.documents
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 10. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_documents_updated_at ON public.documents;
CREATE TRIGGER trigger_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- 11. Créer le bucket de stockage unifié (s'il n'existe pas)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- 12. Politiques de stockage pour le bucket documents
DROP POLICY IF EXISTS "Authenticated users can view documents storage" ON storage.objects;
CREATE POLICY "Authenticated users can view documents storage"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can upload documents storage" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents storage"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete documents storage" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents storage"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- 13. Fonction pour journaliser les actions sur documents
CREATE OR REPLACE FUNCTION log_document_action_unified(
  p_action TEXT,
  p_document_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_file_name TEXT,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_user_email TEXT;
  v_module_name module_name;
BEGIN
  -- Récupérer l'email de l'utilisateur
  SELECT email INTO v_user_email FROM public.profiles WHERE id = p_user_id;
  
  -- Mapper entity_type vers module_name
  v_module_name := CASE p_entity_type
    WHEN 'project' THEN 'projets'::module_name
    WHEN 'convention' THEN 'conventions'::module_name
    WHEN 'contract' THEN 'marches'::module_name
    WHEN 'budget' THEN 'comptabilite'::module_name
    WHEN 'expense' THEN 'comptabilite'::module_name
    WHEN 'asset' THEN 'immobilisations'::module_name
    ELSE 'projets'::module_name
  END;
  
  -- Insérer dans audit_logs
  INSERT INTO public.audit_logs (
    action,
    resource_type,
    resource_id,
    user_id,
    user_email,
    module,
    new_values
  ) VALUES (
    p_action,
    'document',
    p_document_id::text,
    p_user_id,
    v_user_email,
    v_module_name,
    jsonb_build_object(
      'entity_type', p_entity_type,
      'entity_id', p_entity_id,
      'file_name', p_file_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;