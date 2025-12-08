
-- Add frozen status to budgets if not exists
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS is_frozen boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS frozen_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS frozen_reason text;

-- Function to check if a budget is frozen (based on fiscal year closing date)
CREATE OR REPLACE FUNCTION public.is_budget_frozen(p_budget_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget record;
  v_fiscal_year record;
  v_is_frozen boolean := false;
  v_reason text := null;
BEGIN
  -- Get budget info
  SELECT b.*, fy.end_date, fy.is_open, fy.name as fiscal_year_name
  INTO v_budget
  FROM budgets b
  JOIN fiscal_years fy ON b.fiscal_year_id = fy.id
  WHERE b.id = p_budget_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('is_frozen', false, 'reason', 'Budget non trouvé');
  END IF;
  
  -- Check if budget is explicitly frozen
  IF v_budget.is_frozen = true THEN
    RETURN jsonb_build_object(
      'is_frozen', true, 
      'reason', COALESCE(v_budget.frozen_reason, 'Budget gelé manuellement'),
      'frozen_at', v_budget.frozen_at
    );
  END IF;
  
  -- Check if fiscal year is closed
  IF v_budget.is_open = false THEN
    RETURN jsonb_build_object(
      'is_frozen', true, 
      'reason', 'Exercice fiscal ' || v_budget.fiscal_year_name || ' clôturé',
      'frozen_at', v_budget.end_date
    );
  END IF;
  
  -- Check if we're past the fiscal year end date
  IF v_budget.end_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'is_frozen', true, 
      'reason', 'Date de clôture de l''exercice ' || v_budget.fiscal_year_name || ' dépassée (' || to_char(v_budget.end_date, 'DD/MM/YYYY') || ')',
      'frozen_at', v_budget.end_date
    );
  END IF;
  
  -- Budget is not frozen
  RETURN jsonb_build_object('is_frozen', false, 'reason', null);
END;
$$;

-- Function to automatically freeze budgets when fiscal year closes
CREATE OR REPLACE FUNCTION public.freeze_budgets_on_fiscal_year_close()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a fiscal year is closed (is_open changes from true to false)
  IF OLD.is_open = true AND NEW.is_open = false THEN
    -- Freeze all non-closed budgets for this fiscal year
    UPDATE budgets
    SET 
      is_frozen = true,
      frozen_at = now(),
      frozen_reason = 'Gel automatique à la clôture de l''exercice ' || NEW.name
    WHERE fiscal_year_id = NEW.id
    AND status != 'clos'
    AND is_frozen = false;
    
    -- Log in audit
    INSERT INTO audit_logs (action, resource_type, resource_id, new_values, module)
    VALUES (
      'budget_auto_freeze',
      'fiscal_year',
      NEW.id::text,
      jsonb_build_object(
        'fiscal_year_name', NEW.name,
        'frozen_budgets_count', (
          SELECT count(*) FROM budgets 
          WHERE fiscal_year_id = NEW.id AND is_frozen = true
        )
      ),
      'comptabilite'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic freeze on fiscal year close
DROP TRIGGER IF EXISTS trigger_freeze_budgets_on_fiscal_year_close ON fiscal_years;
CREATE TRIGGER trigger_freeze_budgets_on_fiscal_year_close
  AFTER UPDATE ON fiscal_years
  FOR EACH ROW
  EXECUTE FUNCTION freeze_budgets_on_fiscal_year_close();

-- Function to check if expense can be created (budget not frozen)
CREATE OR REPLACE FUNCTION public.check_expense_allowed(p_fiscal_year_id uuid, p_budget_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fiscal_year record;
  v_budget_check jsonb;
BEGIN
  -- Check fiscal year
  SELECT * INTO v_fiscal_year
  FROM fiscal_years
  WHERE id = p_fiscal_year_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Exercice fiscal non trouvé');
  END IF;
  
  -- Check if fiscal year is closed
  IF v_fiscal_year.is_open = false THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'reason', 'Exercice fiscal ' || v_fiscal_year.name || ' clôturé - Aucune nouvelle dépense autorisée'
    );
  END IF;
  
  -- Check if we're past the fiscal year end date
  IF v_fiscal_year.end_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'reason', 'Date de clôture de l''exercice dépassée (' || to_char(v_fiscal_year.end_date, 'DD/MM/YYYY') || ') - Aucune nouvelle dépense autorisée'
    );
  END IF;
  
  -- If budget_id provided, also check budget frozen status
  IF p_budget_id IS NOT NULL THEN
    v_budget_check := is_budget_frozen(p_budget_id);
    IF (v_budget_check->>'is_frozen')::boolean = true THEN
      RETURN jsonb_build_object(
        'allowed', false, 
        'reason', 'Budget gelé: ' || (v_budget_check->>'reason')
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object('allowed', true, 'reason', null);
END;
$$;

-- Trigger function to prevent expense creation on frozen budget/fiscal year
CREATE OR REPLACE FUNCTION public.prevent_expense_on_frozen_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check jsonb;
BEGIN
  -- Only check for expense type entries
  IF NEW.entry_type = 'depense' THEN
    v_check := check_expense_allowed(NEW.fiscal_year_id, NEW.budget_id);
    
    IF (v_check->>'allowed')::boolean = false THEN
      RAISE EXCEPTION 'Opération interdite: %', v_check->>'reason';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on journal_entries for expense prevention
DROP TRIGGER IF EXISTS trigger_prevent_expense_on_frozen_budget ON journal_entries;
CREATE TRIGGER trigger_prevent_expense_on_frozen_budget
  BEFORE INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_expense_on_frozen_budget();
