
-- Update the validate_disbursement_transition function with enhanced security rules
CREATE OR REPLACE FUNCTION public.validate_disbursement_transition(
  _disbursement_id uuid, 
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
  _disbursement_creator uuid;
  _is_valid boolean := false;
  _user_role text;
  _amount numeric;
  _related_expense_id uuid;
  _user_email text;
BEGIN
  -- Get current disbursement info
  SELECT workflow_status, created_by, amount, related_expense_id 
  INTO _current_status, _disbursement_creator, _amount, _related_expense_id
  FROM direct_payments WHERE id = _disbursement_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Décaissement non trouvé');
  END IF;
  
  -- SECURITY RULE 1: No user can validate their own request
  IF _new_status IN ('en_validation_daf', 'en_validation_dg', 'valide') AND _user_id = _disbursement_creator THEN
    RETURN json_build_object('success', false, 'error', 'Vous ne pouvez pas valider votre propre demande');
  END IF;
  
  -- SECURITY RULE 3: No modification after validation (except payment)
  IF _current_status IN ('valide', 'paye') AND _new_status NOT IN ('paye') THEN
    RETURN json_build_object('success', false, 'error', 'Modification interdite après validation');
  END IF;
  
  -- Check related expense validation
  IF _related_expense_id IS NOT NULL AND _new_status IN ('soumis', 'en_validation_daf') THEN
    IF NOT is_expense_validated(_related_expense_id) THEN
      RETURN json_build_object('success', false, 'error', 'La dépense associée doit être validée');
    END IF;
  END IF;
  
  -- Check treasury availability
  IF _new_status = 'soumis' THEN
    IF NOT check_treasury_availability(_amount) THEN
      RETURN json_build_object('success', false, 'error', 'Trésorerie insuffisante');
    END IF;
  END IF;
  
  -- Get user role
  SELECT r.name INTO _user_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  AND r.name IN ('admin', 'comptable', 'daf', 'dg')
  LIMIT 1;
  
  -- Validate transition based on current status and user role
  CASE _current_status
    WHEN 'brouillon' THEN
      IF _new_status = 'soumis' AND _user_role IN ('comptable', 'daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'soumis' THEN
      IF _new_status = 'en_validation_daf' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      ELSIF _new_status = 'rejete' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_daf' THEN
      IF _new_status = 'en_validation_dg' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      ELSIF _new_status = 'rejete' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_dg' THEN
      IF _new_status = 'valide' AND _user_role IN ('dg', 'admin') THEN
        _is_valid := true;
      ELSIF _new_status = 'rejete' AND _user_role IN ('dg', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'valide' THEN
      IF _new_status = 'paye' AND _user_role IN ('comptable', 'daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'rejete' THEN
      IF _new_status = 'brouillon' AND _user_role IN ('comptable', 'admin') THEN
        _is_valid := true;
      END IF;
    ELSE
      _is_valid := false;
  END CASE;
  
  IF NOT _is_valid THEN
    RETURN json_build_object('success', false, 'error', 'Transition non autorisée');
  END IF;
  
  -- SECURITY RULE 2: Update with timestamp and validator ID
  UPDATE direct_payments
  SET 
    workflow_status = _new_status,
    status = CASE 
      WHEN _new_status = 'paye' THEN 'paid'
      WHEN _new_status = 'valide' THEN 'approved'
      WHEN _new_status = 'rejete' THEN 'rejected'
      ELSE status
    END,
    rejection_reason = CASE WHEN _new_status = 'rejete' THEN _comment ELSE NULL END,
    rejected_by = CASE WHEN _new_status = 'rejete' THEN _user_id ELSE NULL END,
    rejected_at = CASE WHEN _new_status = 'rejete' THEN now() ELSE NULL END,
    submitted_by = CASE WHEN _new_status = 'soumis' THEN _user_id ELSE submitted_by END,
    submitted_at = CASE WHEN _new_status = 'soumis' THEN now() ELSE submitted_at END,
    daf_validated_by = CASE WHEN _new_status = 'en_validation_dg' THEN _user_id ELSE daf_validated_by END,
    daf_validated_at = CASE WHEN _new_status = 'en_validation_dg' THEN now() ELSE daf_validated_at END,
    dg_validated_by = CASE WHEN _new_status = 'valide' THEN _user_id ELSE dg_validated_by END,
    dg_validated_at = CASE WHEN _new_status = 'valide' THEN now() ELSE dg_validated_at END,
    validated_by = CASE WHEN _new_status = 'valide' THEN _user_id ELSE validated_by END,
    validated_at = CASE WHEN _new_status = 'valide' THEN now() ELSE validated_at END,
    paid_by = CASE WHEN _new_status = 'paye' THEN _user_id ELSE paid_by END,
    paid_at = CASE WHEN _new_status = 'paye' THEN now() ELSE paid_at END,
    payment_date = CASE WHEN _new_status = 'paye' THEN CURRENT_DATE ELSE payment_date END,
    updated_at = now()
  WHERE id = _disbursement_id;
  
  -- SECURITY RULE 5: Log in validation history (mandatory)
  INSERT INTO disbursement_validation_history (disbursement_id, from_status, to_status, action, comment, performed_by)
  VALUES (_disbursement_id, _current_status, _new_status, _new_status, _comment, _user_id);
  
  -- SECURITY RULE 4: Log in audit journal
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
  VALUES (
    _user_id,
    _user_email,
    'workflow_transition',
    'decaissements',
    'disbursement',
    _disbursement_id::text,
    jsonb_build_object('status', _current_status),
    jsonb_build_object('status', _new_status, 'comment', _comment)
  );
  
  RETURN json_build_object('success', true, 'new_status', _new_status);
END;
$function$;

-- Add constraint to prevent direct updates on validated disbursements
CREATE OR REPLACE FUNCTION public.prevent_validated_disbursement_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow updates only through the validate_disbursement_transition function
  -- by checking if the update is changing workflow_status
  IF OLD.workflow_status IN ('valide', 'paye') AND NEW.workflow_status = OLD.workflow_status THEN
    -- Only allow payment date update for 'valide' status
    IF OLD.workflow_status = 'valide' AND (
      OLD.amount != NEW.amount OR
      OLD.beneficiary_name != NEW.beneficiary_name OR
      OLD.description != NEW.description OR
      OLD.convention_id != NEW.convention_id
    ) THEN
      RAISE EXCEPTION 'Modification interdite après validation';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger to enforce the constraint
DROP TRIGGER IF EXISTS check_validated_disbursement_update ON direct_payments;
CREATE TRIGGER check_validated_disbursement_update
  BEFORE UPDATE ON direct_payments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_validated_disbursement_update();

-- Similarly update validate_expense_transition and validate_budget_transition with self-validation check
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
  _is_valid boolean := false;
  _user_role text;
  _user_email text;
BEGIN
  -- Get current entry info
  SELECT expense_workflow_status, created_by INTO _current_status, _entry_creator
  FROM journal_entries WHERE id = _entry_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Écriture non trouvée');
  END IF;
  
  -- SECURITY RULE: No user can validate their own request
  IF _new_status IN ('en_validation_daf', 'en_validation_dt', 'en_validation_dg', 'validee') AND _user_id = _entry_creator THEN
    RETURN json_build_object('success', false, 'error', 'Vous ne pouvez pas valider votre propre demande');
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

-- Update budget transition function with same security rules
CREATE OR REPLACE FUNCTION public.validate_budget_transition(
  _budget_id uuid, 
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
  _budget_creator uuid;
  _is_valid boolean := false;
  _user_role text;
  _fiscal_year_id uuid;
  _total_amount numeric;
  _user_email text;
BEGIN
  -- Get current budget info
  SELECT status, created_by, fiscal_year_id, total_amount 
  INTO _current_status, _budget_creator, _fiscal_year_id, _total_amount
  FROM budgets WHERE id = _budget_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Budget non trouvé');
  END IF;
  
  -- SECURITY RULE: No user can validate their own request
  IF _new_status = 'valide' AND _user_id = _budget_creator THEN
    RETURN json_build_object('success', false, 'error', 'Vous ne pouvez pas valider votre propre demande');
  END IF;
  
  -- SECURITY RULE: No modification after validation
  IF _current_status IN ('valide', 'clos') AND _new_status NOT IN ('clos') THEN
    RETURN json_build_object('success', false, 'error', 'Modification interdite après validation');
  END IF;
  
  -- Check if budget has a fiscal year
  IF _fiscal_year_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Le budget doit être rattaché à un exercice fiscal');
  END IF;
  
  -- Check if total amount is positive when submitting
  IF _new_status = 'soumis' AND (_total_amount IS NULL OR _total_amount <= 0) THEN
    RETURN json_build_object('success', false, 'error', 'Le montant total du budget doit être positif');
  END IF;
  
  -- Check user role
  SELECT r.name INTO _user_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  AND r.name IN ('admin', 'daf', 'dg')
  LIMIT 1;
  
  -- Validate transition based on current status and user role
  CASE _current_status
    WHEN 'draft' THEN
      IF _new_status = 'soumis' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'soumis' THEN
      IF _new_status IN ('valide', 'rejete') AND _user_role IN ('dg', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'rejete' THEN
      IF _new_status = 'draft' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'valide' THEN
      IF _new_status = 'clos' AND _user_role IN ('daf', 'dg', 'admin') THEN
        _is_valid := true;
      END IF;
    ELSE
      _is_valid := false;
  END CASE;
  
  IF NOT _is_valid THEN
    RETURN json_build_object('success', false, 'error', 'Transition non autorisée');
  END IF;
  
  -- Update the budget with timestamp and validator ID
  UPDATE budgets
  SET 
    status = _new_status,
    rejection_reason = CASE WHEN _new_status = 'rejete' THEN _comment ELSE NULL END,
    rejected_by = CASE WHEN _new_status = 'rejete' THEN _user_id ELSE NULL END,
    rejected_at = CASE WHEN _new_status = 'rejete' THEN now() ELSE NULL END,
    submitted_by = CASE WHEN _new_status = 'soumis' THEN _user_id ELSE submitted_by END,
    submitted_at = CASE WHEN _new_status = 'soumis' THEN now() ELSE submitted_at END,
    validated_by = CASE WHEN _new_status = 'valide' THEN _user_id ELSE validated_by END,
    validated_at = CASE WHEN _new_status = 'valide' THEN now() ELSE validated_at END,
    approved_by = CASE WHEN _new_status = 'valide' THEN _user_id ELSE approved_by END,
    approved_at = CASE WHEN _new_status = 'valide' THEN now() ELSE approved_at END,
    closed_by = CASE WHEN _new_status = 'clos' THEN _user_id ELSE closed_by END,
    closed_at = CASE WHEN _new_status = 'clos' THEN now() ELSE closed_at END,
    updated_at = now()
  WHERE id = _budget_id;
  
  -- Log the transition in validation history
  INSERT INTO budget_validation_history (budget_id, from_status, to_status, action, comment, performed_by)
  VALUES (_budget_id, _current_status, _new_status, _new_status, _comment, _user_id);
  
  -- Log in audit journal
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
  VALUES (
    _user_id,
    _user_email,
    'workflow_transition',
    'comptabilite',
    'budget',
    _budget_id::text,
    jsonb_build_object('status', _current_status),
    jsonb_build_object('status', _new_status, 'comment', _comment)
  );
  
  RETURN json_build_object('success', true, 'new_status', _new_status);
END;
$function$;
