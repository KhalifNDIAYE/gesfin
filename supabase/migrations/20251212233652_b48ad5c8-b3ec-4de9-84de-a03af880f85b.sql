-- ============================================
-- RÈGLES GLOBALES DE SÉCURITÉ ANTI-FRAUDE
-- ============================================

-- 1. Fonction générique pour vérifier la séparation des tâches
CREATE OR REPLACE FUNCTION public.check_separation_of_duties(
  _user_id uuid,
  _created_by uuid,
  _submitted_by uuid,
  _action_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Règle 1: Le créateur ne peut pas soumettre
  IF _action_type = 'submit' AND _user_id = _created_by THEN
    RETURN json_build_object(
      'allowed', false,
      'error', 'FRAUDE INTERDITE: Vous ne pouvez pas soumettre une opération que vous avez créée'
    );
  END IF;
  
  -- Règle 2: Le créateur ne peut pas valider
  IF _action_type = 'validate' AND _user_id = _created_by THEN
    RETURN json_build_object(
      'allowed', false,
      'error', 'FRAUDE INTERDITE: Vous ne pouvez pas valider une opération que vous avez créée'
    );
  END IF;
  
  -- Règle 3: Celui qui a soumis ne peut pas valider
  IF _action_type = 'validate' AND _user_id = _submitted_by THEN
    RETURN json_build_object(
      'allowed', false,
      'error', 'FRAUDE INTERDITE: Vous ne pouvez pas valider une opération que vous avez soumise'
    );
  END IF;
  
  RETURN json_build_object('allowed', true, 'error', null);
END;
$$;

-- 2. Fonction pour enregistrer une validation dans l'historique
CREATE OR REPLACE FUNCTION public.log_validation_action(
  _entity_type text,
  _entity_id uuid,
  _user_id uuid,
  _validation_type text,
  _from_status text,
  _to_status text,
  _comment text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _log_id uuid;
  _user_email text;
  _user_name text;
BEGIN
  -- Récupérer les infos utilisateur
  SELECT email, full_name INTO _user_email, _user_name
  FROM profiles WHERE id = _user_id;
  
  -- Enregistrer dans audit_logs
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    module,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    _user_id,
    _user_email,
    'validation_' || _validation_type,
    CASE 
      WHEN _entity_type IN ('budget', 'budget_line', 'budget_transfer') THEN 'comptabilite'
      WHEN _entity_type IN ('expense', 'journal_entry') THEN 'comptabilite'
      WHEN _entity_type IN ('disbursement', 'direct_payment') THEN 'decaissements'
      WHEN _entity_type IN ('contract', 'engagement') THEN 'marches'
      ELSE 'securite'
    END,
    _entity_type,
    _entity_id::text,
    jsonb_build_object('status', _from_status),
    jsonb_build_object(
      'status', _to_status,
      'validation_type', _validation_type,
      'validator_name', _user_name,
      'comment', _comment,
      'timestamp', now()
    )
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- 3. Fonction pour enregistrer les actions critiques
CREATE OR REPLACE FUNCTION public.log_critical_action(
  _action text,
  _module text,
  _resource_type text,
  _resource_id text,
  _user_id uuid,
  _details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _log_id uuid;
  _user_email text;
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
    _module::module_name,
    _resource_type,
    _resource_id,
    COALESCE(_details, '{}'::jsonb) || jsonb_build_object('timestamp', now(), 'is_critical', true)
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- 4. Trigger pour empêcher les modifications sur budget validé
CREATE OR REPLACE FUNCTION public.prevent_validated_budget_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Permettre seulement le changement vers 'clos' depuis 'valide'
  IF OLD.status IN ('valide', 'clos') THEN
    -- Si on essaie de modifier autre chose que le statut
    IF NEW.status NOT IN ('valide', 'clos') THEN
      RAISE EXCEPTION 'INTERDIT: Modification impossible sur un budget validé ou clôturé. Statut actuel: %', OLD.status;
    END IF;
    
    -- Si on essaie de modifier les montants
    IF NEW.total_amount != OLD.total_amount OR 
       NEW.total_amount_local != OLD.total_amount_local THEN
      RAISE EXCEPTION 'INTERDIT: Les montants d''un budget validé ne peuvent pas être modifiés';
    END IF;
    
    -- Si on essaie de modifier les dates
    IF NEW.start_date != OLD.start_date OR 
       NEW.end_date != OLD.end_date THEN
      RAISE EXCEPTION 'INTERDIT: Les dates d''un budget validé ne peuvent pas être modifiées';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table budgets
DROP TRIGGER IF EXISTS trigger_prevent_validated_budget_modification ON budgets;
CREATE TRIGGER trigger_prevent_validated_budget_modification
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION prevent_validated_budget_modification();

-- 5. Trigger pour empêcher les modifications sur lignes budgétaires de budget validé
CREATE OR REPLACE FUNCTION public.prevent_validated_budget_line_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _budget_status text;
BEGIN
  -- Récupérer le statut du budget parent
  SELECT status INTO _budget_status
  FROM budgets WHERE id = NEW.budget_id;
  
  IF _budget_status IN ('valide', 'clos') THEN
    -- Autoriser seulement les mises à jour des montants réalisés/engagés (via triggers automatiques)
    IF TG_OP = 'UPDATE' THEN
      -- Si on essaie de modifier le montant prévisionnel
      IF NEW.forecast_amount != OLD.forecast_amount OR 
         NEW.forecast_amount_local != OLD.forecast_amount_local THEN
        RAISE EXCEPTION 'INTERDIT: Le montant prévisionnel d''une ligne de budget validé ne peut pas être modifié';
      END IF;
    END IF;
    
    -- Empêcher la suppression
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'INTERDIT: Suppression impossible d''une ligne de budget validé';
    END IF;
    
    -- Empêcher l'insertion
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'INTERDIT: Ajout impossible de lignes à un budget validé';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table budget_lines
DROP TRIGGER IF EXISTS trigger_prevent_validated_budget_line_modification ON budget_lines;
CREATE TRIGGER trigger_prevent_validated_budget_line_modification
  BEFORE INSERT OR UPDATE OR DELETE ON budget_lines
  FOR EACH ROW
  EXECUTE FUNCTION prevent_validated_budget_line_modification();

-- 6. Trigger pour audit automatique des actions critiques sur budgets
CREATE OR REPLACE FUNCTION public.audit_budget_critical_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_email text;
BEGIN
  -- Détecter les actions critiques
  IF TG_OP = 'UPDATE' THEN
    -- Changement de statut
    IF OLD.status != NEW.status THEN
      SELECT email INTO _user_email FROM profiles WHERE id = auth.uid();
      
      INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
      VALUES (
        auth.uid(),
        _user_email,
        'budget_status_change',
        'comptabilite',
        'budget',
        NEW.id::text,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status, 'is_critical', true)
      );
    END IF;
    
    -- Gel/Dégel
    IF OLD.is_frozen != NEW.is_frozen THEN
      SELECT email INTO _user_email FROM profiles WHERE id = auth.uid();
      
      INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
      VALUES (
        auth.uid(),
        _user_email,
        CASE WHEN NEW.is_frozen THEN 'budget_frozen' ELSE 'budget_unfrozen' END,
        'comptabilite',
        'budget',
        NEW.id::text,
        jsonb_build_object('is_frozen', OLD.is_frozen),
        jsonb_build_object('is_frozen', NEW.is_frozen, 'reason', NEW.frozen_reason, 'is_critical', true)
      );
    END IF;
  END IF;
  
  -- Suppression
  IF TG_OP = 'DELETE' THEN
    SELECT email INTO _user_email FROM profiles WHERE id = auth.uid();
    
    INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
    VALUES (
      auth.uid(),
      _user_email,
      'budget_deleted',
      'comptabilite',
      'budget',
      OLD.id::text,
      jsonb_build_object('code', OLD.code, 'name', OLD.name, 'status', OLD.status),
      jsonb_build_object('is_critical', true, 'action', 'DELETE')
    );
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger d'audit sur budgets
DROP TRIGGER IF EXISTS trigger_audit_budget_critical_actions ON budgets;
CREATE TRIGGER trigger_audit_budget_critical_actions
  AFTER UPDATE OR DELETE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION audit_budget_critical_actions();

-- 7. Trigger pour audit des actions critiques sur dépenses
CREATE OR REPLACE FUNCTION public.audit_expense_critical_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_email text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Changement de statut workflow
    IF OLD.expense_workflow_status IS DISTINCT FROM NEW.expense_workflow_status THEN
      SELECT email INTO _user_email FROM profiles WHERE id = auth.uid();
      
      INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
      VALUES (
        auth.uid(),
        _user_email,
        'expense_workflow_change',
        'comptabilite',
        'expense',
        NEW.id::text,
        jsonb_build_object('status', OLD.expense_workflow_status),
        jsonb_build_object('status', NEW.expense_workflow_status, 'is_critical', true)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger d'audit sur journal_entries (dépenses)
DROP TRIGGER IF EXISTS trigger_audit_expense_critical_actions ON journal_entries;
CREATE TRIGGER trigger_audit_expense_critical_actions
  AFTER UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION audit_expense_critical_actions();

-- 8. Mise à jour de validate_budget_transition pour appliquer la séparation des tâches
CREATE OR REPLACE FUNCTION public.validate_budget_transition(_budget_id uuid, _new_status text, _user_id uuid, _comment text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _current_status text;
  _budget_creator uuid;
  _budget_submitted_by uuid;
  _is_valid boolean := false;
  _user_role text;
  _fiscal_year_id uuid;
  _total_amount numeric;
  _user_email text;
  _separation_check json;
BEGIN
  -- Get current budget info
  SELECT status, created_by, submitted_by, fiscal_year_id, total_amount 
  INTO _current_status, _budget_creator, _budget_submitted_by, _fiscal_year_id, _total_amount
  FROM budgets WHERE id = _budget_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Budget non trouvé');
  END IF;
  
  -- RÈGLE: Vérifier la séparation des tâches
  IF _new_status = 'soumis' THEN
    _separation_check := check_separation_of_duties(_user_id, _budget_creator, NULL, 'submit');
    IF NOT (_separation_check->>'allowed')::boolean THEN
      -- Log tentative de fraude
      PERFORM log_critical_action(
        'fraud_attempt_submit',
        'comptabilite',
        'budget',
        _budget_id::text,
        _user_id,
        jsonb_build_object('rule', 'separation_of_duties', 'blocked', true)
      );
      RETURN json_build_object('success', false, 'error', _separation_check->>'error');
    END IF;
  END IF;
  
  IF _new_status = 'valide' THEN
    _separation_check := check_separation_of_duties(_user_id, _budget_creator, _budget_submitted_by, 'validate');
    IF NOT (_separation_check->>'allowed')::boolean THEN
      -- Log tentative de fraude
      PERFORM log_critical_action(
        'fraud_attempt_validate',
        'comptabilite',
        'budget',
        _budget_id::text,
        _user_id,
        jsonb_build_object('rule', 'separation_of_duties', 'blocked', true)
      );
      RETURN json_build_object('success', false, 'error', _separation_check->>'error');
    END IF;
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
  
  -- Log validation action
  PERFORM log_validation_action(
    'budget',
    _budget_id,
    _user_id,
    _new_status,
    _current_status,
    _new_status,
    _comment
  );
  
  RETURN json_build_object('success', true, 'new_status', _new_status);
END;
$function$;