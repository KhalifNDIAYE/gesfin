-- Fonction renforcée avec règles anti-fraude complètes
CREATE OR REPLACE FUNCTION public.validate_expense_transition(
  _entry_id uuid, 
  _new_status text, 
  _user_id uuid, 
  _comment text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_status text;
  _entry_creator uuid;
  _submitted_by uuid;
  _daf_validated_by uuid;
  _dt_validated_by uuid;
  _dg_validated_by uuid;
  _project_id uuid;
  _project_responsible uuid;
  _is_valid boolean := false;
  _user_role text;
  _user_email text;
  _fraud_message text;
BEGIN
  -- Get current entry info including all validators
  SELECT 
    expense_workflow_status, 
    created_by,
    project_id,
    daf_validated_by,
    dt_validated_by,
    dg_validated_by
  INTO 
    _current_status, 
    _entry_creator,
    _project_id,
    _daf_validated_by,
    _dt_validated_by,
    _dg_validated_by
  FROM journal_entries WHERE id = _entry_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Écriture non trouvée');
  END IF;
  
  -- Get project responsible if project is linked
  IF _project_id IS NOT NULL THEN
    SELECT responsible_id INTO _project_responsible
    FROM projects WHERE id = _project_id;
  END IF;
  
  -- ============================================
  -- RÈGLES ANTI-FRAUDE
  -- ============================================
  
  -- RÈGLE 1: Le créateur ne peut pas soumettre ET valider sa propre dépense
  -- Un utilisateur qui a créé la dépense ne peut effectuer aucune validation
  IF _new_status IN ('en_validation_daf', 'en_validation_dt', 'en_validation_dg', 'validee') THEN
    IF _user_id = _entry_creator THEN
      INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
      SELECT _user_id, p.email, 'fraud_attempt', 'comptabilite', 'expense', _entry_id::text,
        jsonb_build_object('rule', 'creator_validation', 'attempted_status', _new_status, 'blocked', true)
      FROM profiles p WHERE p.id = _user_id;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'FRAUDE INTERDITE: Vous ne pouvez pas valider une dépense que vous avez créée'
      );
    END IF;
  END IF;
  
  -- RÈGLE 2: Un validateur ne peut pas valider deux étapes consécutives
  -- Évite qu'une seule personne contrôle plusieurs étapes de validation
  IF _new_status = 'en_validation_dt' AND _user_id = _daf_validated_by THEN
    INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
    SELECT _user_id, p.email, 'fraud_attempt', 'comptabilite', 'expense', _entry_id::text,
      jsonb_build_object('rule', 'consecutive_validation', 'previous_step', 'daf', 'attempted_step', 'dt', 'blocked', true)
    FROM profiles p WHERE p.id = _user_id;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'FRAUDE INTERDITE: Vous avez déjà validé l''étape DAF, vous ne pouvez pas valider l''étape DT'
    );
  END IF;
  
  IF _new_status = 'en_validation_dg' AND _user_id = _dt_validated_by THEN
    INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
    SELECT _user_id, p.email, 'fraud_attempt', 'comptabilite', 'expense', _entry_id::text,
      jsonb_build_object('rule', 'consecutive_validation', 'previous_step', 'dt', 'attempted_step', 'dg', 'blocked', true)
    FROM profiles p WHERE p.id = _user_id;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'FRAUDE INTERDITE: Vous avez déjà validé l''étape DT, vous ne pouvez pas valider l''étape DG'
    );
  END IF;
  
  IF _new_status = 'validee' AND _user_id = _dg_validated_by THEN
    INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
    SELECT _user_id, p.email, 'fraud_attempt', 'comptabilite', 'expense', _entry_id::text,
      jsonb_build_object('rule', 'consecutive_validation', 'previous_step', 'dg', 'attempted_step', 'final', 'blocked', true)
    FROM profiles p WHERE p.id = _user_id;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'FRAUDE INTERDITE: Vous avez déjà validé l''étape DG, vous ne pouvez pas effectuer la validation finale'
    );
  END IF;
  
  -- RÈGLE 3: Un utilisateur ne peut pas valider une dépense liée à son propre projet
  IF _project_id IS NOT NULL AND _project_responsible = _user_id THEN
    IF _new_status IN ('en_validation_daf', 'en_validation_dt', 'en_validation_dg', 'validee') THEN
      INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
      SELECT _user_id, p.email, 'fraud_attempt', 'comptabilite', 'expense', _entry_id::text,
        jsonb_build_object('rule', 'own_project_validation', 'project_id', _project_id, 'blocked', true)
      FROM profiles p WHERE p.id = _user_id;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'FRAUDE INTERDITE: Vous ne pouvez pas valider une dépense liée à un projet dont vous êtes responsable'
      );
    END IF;
  END IF;
  
  -- RÈGLE 4: Un utilisateur ne peut pas avoir validé PLUS D'UNE étape du processus
  -- Vérifie si l'utilisateur a déjà validé une étape précédente
  IF _new_status IN ('en_validation_dt', 'en_validation_dg', 'validee') THEN
    IF _user_id = _daf_validated_by THEN
      INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
      SELECT _user_id, p.email, 'fraud_attempt', 'comptabilite', 'expense', _entry_id::text,
        jsonb_build_object('rule', 'multiple_validation', 'previous_step', 'daf', 'blocked', true)
      FROM profiles p WHERE p.id = _user_id;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'FRAUDE INTERDITE: Vous avez déjà validé l''étape DAF de cette dépense'
      );
    END IF;
  END IF;
  
  IF _new_status IN ('en_validation_dg', 'validee') THEN
    IF _user_id = _dt_validated_by THEN
      INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
      SELECT _user_id, p.email, 'fraud_attempt', 'comptabilite', 'expense', _entry_id::text,
        jsonb_build_object('rule', 'multiple_validation', 'previous_step', 'dt', 'blocked', true)
      FROM profiles p WHERE p.id = _user_id;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'FRAUDE INTERDITE: Vous avez déjà validé l''étape DT de cette dépense'
      );
    END IF;
  END IF;
  
  -- SECURITY RULE: No modification after validation
  IF _current_status IN ('validee', 'payee') AND _new_status NOT IN ('payee') THEN
    RETURN json_build_object('success', false, 'error', 'Modification interdite après validation');
  END IF;
  
  -- Check user role
  SELECT r.name INTO _user_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  AND r.name IN ('admin', 'daf', 'dt', 'dg')
  LIMIT 1;
  
  -- Validate transition based on current status and user role
  CASE _current_status
    WHEN 'brouillon' THEN
      IF _new_status = 'soumise' AND (_entry_creator = _user_id OR _user_role = 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'soumise' THEN
      IF _new_status IN ('en_validation_daf', 'rejetee') AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_daf' THEN
      IF _new_status IN ('en_validation_dt', 'rejetee') AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_dt' THEN
      IF _new_status IN ('en_validation_dg', 'rejetee') AND _user_role IN ('dt', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_dg' THEN
      IF _new_status IN ('validee', 'rejetee') AND _user_role IN ('dg', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'validee' THEN
      IF _new_status = 'payee' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'rejetee' THEN
      IF _new_status = 'brouillon' AND (_entry_creator = _user_id OR _user_role = 'admin') THEN
        _is_valid := true;
      END IF;
    ELSE
      _is_valid := false;
  END CASE;
  
  IF NOT _is_valid THEN
    RETURN json_build_object('success', false, 'error', 'Transition non autorisée');
  END IF;
  
  -- Update the entry with timestamp and validator ID
  UPDATE journal_entries
  SET 
    expense_workflow_status = _new_status,
    rejection_reason = CASE WHEN _new_status = 'rejetee' THEN _comment ELSE NULL END,
    rejected_by = CASE WHEN _new_status = 'rejetee' THEN _user_id ELSE NULL END,
    rejected_at = CASE WHEN _new_status = 'rejetee' THEN now() ELSE NULL END,
    daf_validated_by = CASE WHEN _new_status = 'en_validation_daf' THEN _user_id ELSE daf_validated_by END,
    daf_validated_at = CASE WHEN _new_status = 'en_validation_daf' THEN now() ELSE daf_validated_at END,
    dt_validated_by = CASE WHEN _new_status = 'en_validation_dt' THEN _user_id ELSE dt_validated_by END,
    dt_validated_at = CASE WHEN _new_status = 'en_validation_dt' THEN now() ELSE dt_validated_at END,
    dg_validated_by = CASE WHEN _new_status = 'en_validation_dg' THEN _user_id ELSE dg_validated_by END,
    dg_validated_at = CASE WHEN _new_status = 'en_validation_dg' THEN now() ELSE dg_validated_at END,
    paid_by = CASE WHEN _new_status = 'payee' THEN _user_id ELSE paid_by END,
    paid_at = CASE WHEN _new_status = 'payee' THEN now() ELSE paid_at END,
    validated_by = CASE WHEN _new_status = 'validee' THEN _user_id ELSE validated_by END,
    validated_at = CASE WHEN _new_status = 'validee' THEN now() ELSE validated_at END,
    updated_at = now()
  WHERE id = _entry_id;
  
  -- Log the transition in validation history
  INSERT INTO expense_validation_history (journal_entry_id, from_status, to_status, action, comment, performed_by)
  VALUES (_entry_id, _current_status, _new_status, _new_status, _comment, _user_id);
  
  -- Log in audit journal
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
  VALUES (
    _user_id,
    _user_email,
    'workflow_transition',
    'comptabilite',
    'expense',
    _entry_id::text,
    jsonb_build_object('status', _current_status),
    jsonb_build_object('status', _new_status, 'comment', _comment)
  );
  
  RETURN json_build_object('success', true, 'new_status', _new_status);
END;
$function$;

-- Créer une fonction pour vérifier les conflits anti-fraude (utilisable côté client)
CREATE OR REPLACE FUNCTION public.check_expense_fraud_rules(
  _entry_id uuid,
  _user_id uuid,
  _intended_action text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _entry_creator uuid;
  _project_id uuid;
  _project_responsible uuid;
  _daf_validated_by uuid;
  _dt_validated_by uuid;
  _dg_validated_by uuid;
  _conflicts jsonb := '[]'::jsonb;
BEGIN
  -- Get entry info
  SELECT 
    created_by,
    project_id,
    daf_validated_by,
    dt_validated_by,
    dg_validated_by
  INTO 
    _entry_creator,
    _project_id,
    _daf_validated_by,
    _dt_validated_by,
    _dg_validated_by
  FROM journal_entries WHERE id = _entry_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('has_conflicts', false, 'conflicts', '[]'::jsonb);
  END IF;
  
  -- Get project responsible
  IF _project_id IS NOT NULL THEN
    SELECT responsible_id INTO _project_responsible
    FROM projects WHERE id = _project_id;
  END IF;
  
  -- Check: Creator cannot validate
  IF _user_id = _entry_creator AND _intended_action IN ('validate', 'approve') THEN
    _conflicts := _conflicts || jsonb_build_array(jsonb_build_object(
      'rule', 'creator_validation',
      'message', 'Vous êtes le créateur de cette dépense et ne pouvez pas la valider'
    ));
  END IF;
  
  -- Check: Project responsible cannot validate own project expenses
  IF _project_responsible = _user_id AND _intended_action IN ('validate', 'approve') THEN
    _conflicts := _conflicts || jsonb_build_array(jsonb_build_object(
      'rule', 'own_project_validation',
      'message', 'Vous êtes responsable du projet lié à cette dépense'
    ));
  END IF;
  
  -- Check: Already validated a step
  IF _user_id = _daf_validated_by AND _intended_action IN ('validate', 'approve') THEN
    _conflicts := _conflicts || jsonb_build_array(jsonb_build_object(
      'rule', 'already_validated_daf',
      'message', 'Vous avez déjà validé l''étape DAF de cette dépense'
    ));
  END IF;
  
  IF _user_id = _dt_validated_by AND _intended_action IN ('validate', 'approve') THEN
    _conflicts := _conflicts || jsonb_build_array(jsonb_build_object(
      'rule', 'already_validated_dt',
      'message', 'Vous avez déjà validé l''étape DT de cette dépense'
    ));
  END IF;
  
  IF _user_id = _dg_validated_by AND _intended_action IN ('validate', 'approve') THEN
    _conflicts := _conflicts || jsonb_build_array(jsonb_build_object(
      'rule', 'already_validated_dg',
      'message', 'Vous avez déjà validé l''étape DG de cette dépense'
    ));
  END IF;
  
  RETURN json_build_object(
    'has_conflicts', jsonb_array_length(_conflicts) > 0,
    'conflicts', _conflicts
  );
END;
$$;