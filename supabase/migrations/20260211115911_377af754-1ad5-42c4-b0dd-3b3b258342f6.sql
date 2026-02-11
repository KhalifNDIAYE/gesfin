
-- Fonction centralisée d'agrégation Budget vs Dépenses pour le tableau de bord
-- Retourne les N derniers mois avec budget (prévisions) et dépenses (réalisations)
-- Sources Budget: budget_movements (forecast) + fallback proration budgets validés
-- Sources Dépenses: budget_movements (realization) + cash_operations (sortie validée)
--                   + contract_payments (processed) + direct_payments (payé)

CREATE OR REPLACE FUNCTION public.get_budget_tracking_data(p_months integer DEFAULT 6)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  v_start_date date;
BEGIN
  v_start_date := date_trunc('month', CURRENT_DATE - make_interval(months => p_months - 1))::date;

  WITH months AS (
    SELECT generate_series(
      date_trunc('month', v_start_date::timestamp),
      date_trunc('month', CURRENT_DATE::timestamp),
      '1 month'::interval
    )::date AS month_start
  ),
  -- ═══════════════════════════════════════════
  -- BUDGET: mouvements de type forecast par mois
  -- ═══════════════════════════════════════════
  budget_forecast AS (
    SELECT 
      date_trunc('month', movement_date::date)::date AS month,
      SUM(amount) AS total
    FROM budget_movements
    WHERE movement_type = 'forecast'
    AND movement_date::date >= v_start_date
    GROUP BY 1
  ),
  -- BUDGET fallback: proration des budgets validés sur les mois de l'exercice
  budget_proration AS (
    SELECT 
      m.month_start AS month,
      SUM(
        b.total_amount / GREATEST(
          (EXTRACT(YEAR FROM AGE(fy.end_date::date, fy.start_date::date)) * 12 +
           EXTRACT(MONTH FROM AGE(fy.end_date::date, fy.start_date::date)) + 1),
          1
        )
      ) AS total
    FROM months m
    CROSS JOIN budgets b
    JOIN fiscal_years fy ON b.fiscal_year_id = fy.id
    WHERE b.status IN ('approved', 'validated', 'active', 'valide')
    AND m.month_start >= fy.start_date::date
    AND m.month_start <= fy.end_date::date
    GROUP BY 1
  ),
  -- ═══════════════════════════════════════════
  -- DÉPENSES: réalisations budgétaires
  -- ═══════════════════════════════════════════
  dep_realizations AS (
    SELECT 
      date_trunc('month', movement_date::date)::date AS month,
      SUM(amount) AS total
    FROM budget_movements
    WHERE movement_type = 'realization'
    AND movement_date::date >= v_start_date
    GROUP BY 1
  ),
  -- DÉPENSES: opérations de caisse (sorties validées)
  dep_cash AS (
    SELECT 
      date_trunc('month', operation_date::date)::date AS month,
      SUM(amount) AS total
    FROM cash_operations
    WHERE operation_type = 'sortie'
    AND status = 'validated'
    AND operation_date::date >= v_start_date
    GROUP BY 1
  ),
  -- DÉPENSES: règlements marchés (processed)
  dep_contracts AS (
    SELECT 
      date_trunc('month', payment_date::date)::date AS month,
      SUM(amount) AS total
    FROM contract_payments
    WHERE status = 'processed'
    AND payment_date::date >= v_start_date
    GROUP BY 1
  ),
  -- DÉPENSES: paiements directs (payés)
  dep_direct AS (
    SELECT 
      date_trunc('month', payment_date::date)::date AS month,
      SUM(amount) AS total
    FROM direct_payments
    WHERE workflow_status = 'paye'
    AND payment_date::date >= v_start_date
    GROUP BY 1
  )
  SELECT json_agg(
    json_build_object(
      'month_start', to_char(m.month_start, 'YYYY-MM-DD'),
      'budget', ROUND(COALESCE(NULLIF(bf.total, 0), bp.total, 0)),
      'depenses', ROUND(
        COALESCE(dr.total, 0) +
        COALESCE(dc.total, 0) +
        COALESCE(dcon.total, 0) +
        COALESCE(dd.total, 0)
      )
    ) ORDER BY m.month_start
  )
  INTO result
  FROM months m
  LEFT JOIN budget_forecast bf ON bf.month = m.month_start
  LEFT JOIN budget_proration bp ON bp.month = m.month_start
  LEFT JOIN dep_realizations dr ON dr.month = m.month_start
  LEFT JOIN dep_cash dc ON dc.month = m.month_start
  LEFT JOIN dep_contracts dcon ON dcon.month = m.month_start
  LEFT JOIN dep_direct dd ON dd.month = m.month_start;

  RETURN COALESCE(result, '[]'::json);
END;
$$;
