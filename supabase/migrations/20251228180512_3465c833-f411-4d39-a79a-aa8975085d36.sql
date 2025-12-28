-- Fix function search_path security warnings

-- Fix update_documents_updated_at function
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix log_document_action_unified function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;