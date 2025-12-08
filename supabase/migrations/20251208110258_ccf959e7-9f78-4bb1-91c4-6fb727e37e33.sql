
-- =====================================================
-- RÈGLES DE VERROUILLAGE - Empêcher modification après validation
-- =====================================================

-- 1. Fonction pour vérifier si un budget est modifiable
CREATE OR REPLACE FUNCTION public.check_budget_modifiable()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est une mise à jour
  IF TG_OP = 'UPDATE' THEN
    -- Vérifier si l'ancien statut est validé/approuvé/clos
    IF OLD.status IN ('valide', 'approuve', 'clos') THEN
      -- Permettre uniquement le changement vers 'annule' par un admin
      IF NEW.status = 'annule' AND is_admin(auth.uid()) THEN
        RETURN NEW;
      END IF;
      -- Permettre les transitions de workflow normales (pas de modification de données)
      IF OLD.status = NEW.status THEN
        RAISE EXCEPTION 'Ce budget est validé et ne peut plus être modifié. Seule une annulation administrative est possible.';
      END IF;
    END IF;
  END IF;
  
  -- Si c'est une suppression
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('valide', 'approuve', 'clos') THEN
      RAISE EXCEPTION 'Ce budget est validé et ne peut pas être supprimé. Seule une annulation administrative est possible.';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fonction pour vérifier si une ligne de budget est modifiable
CREATE OR REPLACE FUNCTION public.check_budget_line_modifiable()
RETURNS TRIGGER AS $$
DECLARE
  budget_status TEXT;
BEGIN
  -- Récupérer le statut du budget parent
  SELECT status INTO budget_status FROM budgets WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  IF budget_status IN ('valide', 'approuve', 'clos') THEN
    -- Permettre les mises à jour des montants réalisés/engagés (opérations comptables)
    IF TG_OP = 'UPDATE' AND (
      NEW.realized_amount IS DISTINCT FROM OLD.realized_amount OR
      NEW.committed_amount IS DISTINCT FROM OLD.committed_amount OR
      NEW.realized_amount_local IS DISTINCT FROM OLD.realized_amount_local OR
      NEW.committed_amount_local IS DISTINCT FROM OLD.committed_amount_local
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Bloquer les autres modifications
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Le budget est validé. Impossible d''ajouter de nouvelles lignes.';
    ELSIF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Le budget est validé. Impossible de supprimer des lignes.';
    ELSIF TG_OP = 'UPDATE' THEN
      RAISE EXCEPTION 'Le budget est validé. Seuls les montants réalisés/engagés peuvent être modifiés.';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fonction pour vérifier si une dépense est modifiable
CREATE OR REPLACE FUNCTION public.check_expense_modifiable()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Statuts validés pour les dépenses
    IF OLD.workflow_status IN ('valide_daf', 'valide_dg', 'paye') THEN
      -- Permettre uniquement l'annulation par admin
      IF NEW.workflow_status = 'annule' AND is_admin(auth.uid()) THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Cette dépense est validée et ne peut plus être modifiée. Seule une annulation administrative est possible.';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.workflow_status IN ('valide_daf', 'valide_dg', 'paye') THEN
      RAISE EXCEPTION 'Cette dépense est validée et ne peut pas être supprimée. Seule une annulation administrative est possible.';
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Fonction pour vérifier si un décaissement est modifiable
CREATE OR REPLACE FUNCTION public.check_disbursement_modifiable()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Statuts validés pour les décaissements (direct_payments)
    IF OLD.workflow_status IN ('valide_daf', 'valide_dg', 'paye') THEN
      -- Permettre uniquement l'annulation par admin
      IF NEW.workflow_status = 'annule' AND is_admin(auth.uid()) THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Ce décaissement est validé et ne peut plus être modifié. Seule une annulation administrative est possible.';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.workflow_status IN ('valide_daf', 'valide_dg', 'paye') THEN
      RAISE EXCEPTION 'Ce décaissement est validé et ne peut pas être supprimé. Seule une annulation administrative est possible.';
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Fonction pour vérifier si une écriture comptable est modifiable
CREATE OR REPLACE FUNCTION public.check_journal_entry_modifiable()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'valide' THEN
      -- Permettre uniquement l'annulation par admin
      IF NEW.status = 'annule' AND is_admin(auth.uid()) THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Cette écriture comptable est validée et ne peut plus être modifiée. Seule une annulation administrative est possible.';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'valide' THEN
      RAISE EXCEPTION 'Cette écriture comptable est validée et ne peut pas être supprimée. Seule une annulation administrative est possible.';
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Créer les triggers

-- Trigger pour budgets
DROP TRIGGER IF EXISTS check_budget_modifiable_trigger ON budgets;
CREATE TRIGGER check_budget_modifiable_trigger
  BEFORE UPDATE OR DELETE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION check_budget_modifiable();

-- Trigger pour budget_lines
DROP TRIGGER IF EXISTS check_budget_line_modifiable_trigger ON budget_lines;
CREATE TRIGGER check_budget_line_modifiable_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON budget_lines
  FOR EACH ROW
  EXECUTE FUNCTION check_budget_line_modifiable();

-- Trigger pour journal_entries (dépenses/écritures)
DROP TRIGGER IF EXISTS check_journal_entry_modifiable_trigger ON journal_entries;
CREATE TRIGGER check_journal_entry_modifiable_trigger
  BEFORE UPDATE OR DELETE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_journal_entry_modifiable();

-- Trigger pour direct_payments (décaissements)
DROP TRIGGER IF EXISTS check_disbursement_modifiable_trigger ON direct_payments;
CREATE TRIGGER check_disbursement_modifiable_trigger
  BEFORE UPDATE OR DELETE ON direct_payments
  FOR EACH ROW
  EXECUTE FUNCTION check_disbursement_modifiable();

-- 7. Fonction d'annulation administrative avec journalisation
CREATE OR REPLACE FUNCTION public.admin_cancel_record(
  p_table_name TEXT,
  p_record_id UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_old_status TEXT;
  v_result JSONB;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Seul un administrateur peut annuler un enregistrement validé';
  END IF;
  
  -- Traiter selon la table
  CASE p_table_name
    WHEN 'budgets' THEN
      SELECT status INTO v_old_status FROM budgets WHERE id = p_record_id;
      UPDATE budgets SET status = 'annule' WHERE id = p_record_id;
      
    WHEN 'journal_entries' THEN
      SELECT status INTO v_old_status FROM journal_entries WHERE id = p_record_id;
      UPDATE journal_entries SET status = 'annule' WHERE id = p_record_id;
      
    WHEN 'direct_payments' THEN
      SELECT workflow_status INTO v_old_status FROM direct_payments WHERE id = p_record_id;
      UPDATE direct_payments SET workflow_status = 'annule', status = 'cancelled' WHERE id = p_record_id;
      
    ELSE
      RAISE EXCEPTION 'Table non supportée pour l''annulation: %', p_table_name;
  END CASE;
  
  -- Journaliser l'annulation
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
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'ANNULATION_ADMINISTRATIVE',
    CASE p_table_name
      WHEN 'budgets' THEN 'comptabilite'::module_name
      WHEN 'journal_entries' THEN 'comptabilite'::module_name
      WHEN 'direct_payments' THEN 'conventions'::module_name
    END,
    p_table_name,
    p_record_id::TEXT,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', 'annule', 'reason', p_reason)
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'table', p_table_name,
    'record_id', p_record_id,
    'old_status', v_old_status,
    'new_status', 'annule',
    'reason', p_reason
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Accorder les permissions
GRANT EXECUTE ON FUNCTION public.admin_cancel_record(TEXT, UUID, TEXT) TO authenticated;
