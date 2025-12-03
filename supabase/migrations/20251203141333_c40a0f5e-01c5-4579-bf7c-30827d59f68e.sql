
-- Drop existing triggers and functions if they exist to avoid conflicts
DROP TRIGGER IF EXISTS auto_generate_project_code ON projects;
DROP TRIGGER IF EXISTS prevent_project_code_modification ON projects;
DROP TRIGGER IF EXISTS prevent_bailleur_code_modification ON bailleurs;
DROP TRIGGER IF EXISTS prevent_convention_code_modification ON conventions;
DROP TRIGGER IF EXISTS prevent_contract_code_modification ON contracts;
DROP TRIGGER IF EXISTS prevent_direct_payment_code_modification ON direct_payments;
DROP TRIGGER IF EXISTS prevent_third_party_code_modification ON third_parties;
DROP TRIGGER IF EXISTS prevent_budget_code_modification ON budgets;
DROP TRIGGER IF EXISTS prevent_asset_code_modification ON assets;
DROP TRIGGER IF EXISTS prevent_replenishment_code_modification ON replenishments;
DROP FUNCTION IF EXISTS auto_generate_project_code();
DROP FUNCTION IF EXISTS prevent_code_modification();

-- Create a generic function to generate codes with format PREFIX-YYYY-XXX
CREATE OR REPLACE FUNCTION public.generate_entity_code(
  _prefix TEXT,
  _table_name TEXT,
  _code_column TEXT DEFAULT 'code'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _year TEXT;
  _sequence INTEGER;
  _new_code TEXT;
  _pattern TEXT;
BEGIN
  _year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  _pattern := _prefix || '-' || _year || '-%';
  
  -- Get the max sequence for this prefix and year
  EXECUTE format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM %L) AS INTEGER)), 0) + 1 FROM %I WHERE %I LIKE %L',
    _code_column,
    _prefix || '-' || _year || '-(\d+)',
    _table_name,
    _code_column,
    _pattern
  ) INTO _sequence;
  
  -- Alternative approach using regexp_replace
  EXECUTE format(
    'SELECT COALESCE(MAX(
      CAST(regexp_replace(%I, %L, %L) AS INTEGER)
    ), 0) + 1
    FROM %I 
    WHERE %I LIKE %L 
    AND regexp_replace(%I, %L, %L) ~ %L',
    _code_column,
    '^' || _prefix || '-' || _year || '-',
    '',
    _table_name,
    _code_column,
    _pattern,
    _code_column,
    '^' || _prefix || '-' || _year || '-',
    '',
    '^\d+$'
  ) INTO _sequence;
  
  _new_code := _prefix || '-' || _year || '-' || LPAD(_sequence::TEXT, 3, '0');
  
  RETURN _new_code;
END;
$$;

-- Create generic trigger function for auto-generating codes
CREATE OR REPLACE FUNCTION public.trigger_generate_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _prefix TEXT;
  _year TEXT;
  _sequence INTEGER;
  _pattern TEXT;
BEGIN
  -- Determine prefix based on table name
  _prefix := CASE TG_TABLE_NAME
    WHEN 'bailleurs' THEN 'BAIL'
    WHEN 'projects' THEN 'PRJ'
    WHEN 'conventions' THEN 'CONV'
    WHEN 'contracts' THEN 'MCH'
    WHEN 'direct_payments' THEN 'DEC'
    WHEN 'replenishments' THEN 'FIN'
    WHEN 'third_parties' THEN 'TIER'
    WHEN 'budgets' THEN 'BUD'
    WHEN 'assets' THEN 'IMM'
    ELSE UPPER(LEFT(TG_TABLE_NAME, 4))
  END;
  
  _year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  _pattern := _prefix || '-' || _year || '-%';
  
  -- Get the max sequence for this prefix and year
  EXECUTE format(
    'SELECT COALESCE(MAX(
      CAST(regexp_replace(code, %L, %L) AS INTEGER)
    ), 0) + 1
    FROM %I 
    WHERE code LIKE %L 
    AND regexp_replace(code, %L, %L) ~ %L',
    '^' || _prefix || '-' || _year || '-',
    '',
    TG_TABLE_NAME,
    _pattern,
    '^' || _prefix || '-' || _year || '-',
    '',
    '^\d+$'
  ) INTO _sequence;
  
  -- If no existing codes found, start at 1
  IF _sequence IS NULL THEN
    _sequence := 1;
  END IF;
  
  NEW.code := _prefix || '-' || _year || '-' || LPAD(_sequence::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$;

-- Create generic trigger function to prevent code modification
CREATE OR REPLACE FUNCTION public.trigger_prevent_code_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.code IS NOT NULL AND NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'La modification du code est interdite. Le code % ne peut pas être changé.', OLD.code;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for BAILLEURS (BAIL-YYYY-XXX)
CREATE TRIGGER auto_generate_bailleur_code
  BEFORE INSERT ON bailleurs
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_bailleur_code_modification
  BEFORE UPDATE ON bailleurs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Create triggers for PROJECTS (PRJ-YYYY-XXX)
CREATE TRIGGER auto_generate_project_code
  BEFORE INSERT ON projects
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_project_code_modification
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Create triggers for CONVENTIONS (CONV-YYYY-XXX)
CREATE TRIGGER auto_generate_convention_code
  BEFORE INSERT ON conventions
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_convention_code_modification
  BEFORE UPDATE ON conventions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Create triggers for CONTRACTS/MARCHES (MCH-YYYY-XXX)
CREATE TRIGGER auto_generate_contract_code
  BEFORE INSERT ON contracts
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_contract_code_modification
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Create triggers for DIRECT_PAYMENTS/DECAISSEMENTS (DEC-YYYY-XXX)
CREATE TRIGGER auto_generate_direct_payment_code
  BEFORE INSERT ON direct_payments
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_direct_payment_code_modification
  BEFORE UPDATE ON direct_payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Create triggers for REPLENISHMENTS/FINANCEMENTS (FIN-YYYY-XXX)
CREATE TRIGGER auto_generate_replenishment_code
  BEFORE INSERT ON replenishments
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_replenishment_code_modification
  BEFORE UPDATE ON replenishments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Create triggers for THIRD_PARTIES/TIERS (TIER-YYYY-XXX)
CREATE TRIGGER auto_generate_third_party_code
  BEFORE INSERT ON third_parties
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_third_party_code_modification
  BEFORE UPDATE ON third_parties
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Create triggers for BUDGETS (BUD-YYYY-XXX)
CREATE TRIGGER auto_generate_budget_code
  BEFORE INSERT ON budgets
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_budget_code_modification
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Create triggers for ASSETS/IMMOBILISATIONS (IMM-YYYY-XXX)
CREATE TRIGGER auto_generate_asset_code
  BEFORE INSERT ON assets
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_asset_code_modification
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- Add unique constraints on code columns (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bailleurs_code_unique') THEN
    ALTER TABLE bailleurs ADD CONSTRAINT bailleurs_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_code_unique') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conventions_code_unique') THEN
    ALTER TABLE conventions ADD CONSTRAINT conventions_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_code_unique') THEN
    ALTER TABLE contracts ADD CONSTRAINT contracts_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'direct_payments_code_unique') THEN
    ALTER TABLE direct_payments ADD CONSTRAINT direct_payments_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'replenishments_code_unique') THEN
    ALTER TABLE replenishments ADD CONSTRAINT replenishments_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'third_parties_code_unique') THEN
    ALTER TABLE third_parties ADD CONSTRAINT third_parties_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'budgets_code_unique') THEN
    ALTER TABLE budgets ADD CONSTRAINT budgets_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_code_unique') THEN
    ALTER TABLE assets ADD CONSTRAINT assets_code_unique UNIQUE (code);
  END IF;
END $$;
