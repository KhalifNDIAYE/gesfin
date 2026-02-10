
-- =====================================================
-- Auto-generate codes for contract sub-entities
-- Prefixes: DCT (Décomptes), REG (Règlements), GAR (Garanties), ENG (Engagements)
-- =====================================================

-- Update the trigger_generate_code function to add the 4 new table mappings
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
    WHEN 'contract_decomptes' THEN 'DCT'
    WHEN 'contract_payments' THEN 'REG'
    WHEN 'contract_guarantees' THEN 'GAR'
    WHEN 'contract_engagements' THEN 'ENG'
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

-- =====================================================
-- DECOMPTES (DCT-YYYY-XXX)
-- =====================================================
CREATE TRIGGER auto_generate_decompte_code
  BEFORE INSERT ON contract_decomptes
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_decompte_code_modification
  BEFORE UPDATE ON contract_decomptes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- =====================================================
-- PAYMENTS / REGLEMENTS (REG-YYYY-XXX)
-- =====================================================
CREATE TRIGGER auto_generate_payment_code
  BEFORE INSERT ON contract_payments
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_payment_code_modification
  BEFORE UPDATE ON contract_payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- =====================================================
-- GUARANTEES / GARANTIES (GAR-YYYY-XXX)
-- =====================================================
CREATE TRIGGER auto_generate_guarantee_code
  BEFORE INSERT ON contract_guarantees
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_guarantee_code_modification
  BEFORE UPDATE ON contract_guarantees
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- =====================================================
-- ENGAGEMENTS (ENG-YYYY-XXX)
-- =====================================================
CREATE TRIGGER auto_generate_engagement_code
  BEFORE INSERT ON contract_engagements
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION trigger_generate_code();

CREATE TRIGGER prevent_engagement_code_modification
  BEFORE UPDATE ON contract_engagements
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_code_modification();

-- =====================================================
-- Unique constraints on code columns
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contract_decomptes_code_unique') THEN
    ALTER TABLE contract_decomptes ADD CONSTRAINT contract_decomptes_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contract_payments_code_unique') THEN
    ALTER TABLE contract_payments ADD CONSTRAINT contract_payments_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contract_guarantees_code_unique') THEN
    ALTER TABLE contract_guarantees ADD CONSTRAINT contract_guarantees_code_unique UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contract_engagements_code_unique') THEN
    ALTER TABLE contract_engagements ADD CONSTRAINT contract_engagements_code_unique UNIQUE (code);
  END IF;
END $$;
