-- =====================================================
-- MIGRATION: Single Source of Truth pour les Marchés
-- Tous les calculs sont effectués par des triggers DB
-- =====================================================

-- 1. Ajouter les colonnes de données sources
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tva_rate numeric DEFAULT 18,
ADD COLUMN IF NOT EXISTS discount_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_fees numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS advances numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS penalties numeric DEFAULT 0;

-- 2. Ajouter les colonnes de valeurs calculées
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS gross_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS after_discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tva_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS execution_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS financial_status text DEFAULT 'En cours';

-- 3. Créer la fonction de calcul automatique
CREATE OR REPLACE FUNCTION public.calculate_contract_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gross_amount numeric;
  v_discount_amount numeric;
  v_after_discount_amount numeric;
  v_tva_amount numeric;
  v_total_ttc numeric;
  v_net_amount numeric;
  v_remaining numeric;
  v_execution_rate numeric;
  v_financial_status text;
BEGIN
  -- Calcul du montant brut
  v_gross_amount := ROUND(COALESCE(NEW.quantity, 1) * COALESCE(NEW.unit_price, 0));
  
  -- Calcul de la remise
  v_discount_amount := ROUND(v_gross_amount * COALESCE(NEW.discount_rate, 0) / 100);
  
  -- Montant après remise
  v_after_discount_amount := v_gross_amount - v_discount_amount;
  
  -- Calcul TVA
  v_tva_amount := ROUND(v_after_discount_amount * COALESCE(NEW.tva_rate, 0) / 100);
  
  -- Montant TTC
  v_total_ttc := v_after_discount_amount + v_tva_amount + COALESCE(NEW.additional_fees, 0);
  
  -- Montant net à payer
  v_net_amount := v_total_ttc - COALESCE(NEW.advances, 0) - COALESCE(NEW.penalties, 0);
  
  -- Solde restant
  v_remaining := GREATEST(0, v_total_ttc - COALESCE(NEW.paid_amount, 0));
  
  -- Taux d'exécution (éviter division par zéro)
  IF v_total_ttc > 0 THEN
    v_execution_rate := ROUND((COALESCE(NEW.paid_amount, 0) / v_total_ttc) * 100, 2);
  ELSE
    v_execution_rate := 0;
  END IF;
  
  -- Progression (0-100)
  NEW.progress_percentage := LEAST(100, GREATEST(0, v_execution_rate));
  
  -- État financier
  IF v_remaining = 0 AND v_total_ttc > 0 THEN
    v_financial_status := 'Soldé';
  ELSE
    v_financial_status := 'En cours';
  END IF;
  
  -- Affecter les valeurs calculées
  NEW.gross_amount := v_gross_amount;
  NEW.discount_amount := v_discount_amount;
  NEW.after_discount_amount := v_after_discount_amount;
  NEW.tva_amount := v_tva_amount;
  NEW.total_amount := v_total_ttc;
  NEW.net_amount := v_net_amount;
  NEW.remaining_amount := v_remaining;
  NEW.execution_rate := v_execution_rate;
  NEW.financial_status := v_financial_status;
  
  RETURN NEW;
END;
$$;

-- 4. Créer le trigger (supprimer l'ancien s'il existe)
DROP TRIGGER IF EXISTS trigger_calculate_contract_amounts ON public.contracts;

CREATE TRIGGER trigger_calculate_contract_amounts
BEFORE INSERT OR UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.calculate_contract_amounts();

-- 5. Mettre à jour les données existantes pour déclencher le calcul
-- D'abord, migrer les données existantes vers la nouvelle structure
UPDATE public.contracts
SET 
  quantity = 1,
  unit_price = COALESCE(total_amount, 0),
  tva_rate = 0,
  discount_rate = 0,
  additional_fees = 0,
  advances = 0,
  penalties = 0
WHERE quantity IS NULL OR unit_price IS NULL;

-- 6. Ajouter un commentaire pour documenter la logique
COMMENT ON FUNCTION public.calculate_contract_amounts() IS 
'Fonction de calcul automatique des montants de marché (SSOT).
Calcule: montant_brut, remise, TVA, TTC, net, solde, taux_execution.
Déclenchée automatiquement à chaque INSERT/UPDATE sur contracts.';