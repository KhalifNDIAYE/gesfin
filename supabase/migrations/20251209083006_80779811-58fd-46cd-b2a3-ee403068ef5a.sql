
-- Corriger les vues avec SECURITY INVOKER au lieu de SECURITY DEFINER

DROP VIEW IF EXISTS public.bailleur_stats;
CREATE VIEW public.bailleur_stats 
WITH (security_invoker = true)
AS
SELECT 
  b.id as bailleur_id,
  b.code as bailleur_code,
  b.name as bailleur_name,
  b.short_name,
  b.is_active,
  COUNT(DISTINCT c.id) as convention_count,
  COUNT(DISTINCT pc.project_id) as project_count,
  COALESCE(SUM(c.total_amount), 0) as total_committed,
  COALESCE(SUM(c.disbursed_amount), 0) as total_disbursed,
  COALESCE(SUM(c.remaining_amount), 0) as total_remaining,
  CASE 
    WHEN COALESCE(SUM(c.total_amount), 0) > 0 
    THEN round((COALESCE(SUM(c.disbursed_amount), 0) / SUM(c.total_amount)) * 100, 2)
    ELSE 0
  END as global_execution_rate
FROM bailleurs b
LEFT JOIN conventions c ON c.bailleur_id = b.id
LEFT JOIN project_conventions pc ON pc.convention_id = c.id
GROUP BY b.id, b.code, b.name, b.short_name, b.is_active;

DROP VIEW IF EXISTS public.convention_project_stats;
CREATE VIEW public.convention_project_stats 
WITH (security_invoker = true)
AS
SELECT 
  c.id as convention_id,
  c.code as convention_code,
  c.name as convention_name,
  c.status,
  c.total_amount,
  c.disbursed_amount,
  c.remaining_amount,
  b.id as bailleur_id,
  b.name as bailleur_name,
  COUNT(DISTINCT pc.project_id) as linked_projects_count,
  ARRAY_AGG(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as project_names,
  CASE 
    WHEN c.total_amount > 0 THEN round((c.disbursed_amount / c.total_amount) * 100, 2)
    ELSE 0
  END as execution_rate
FROM conventions c
LEFT JOIN bailleurs b ON b.id = c.bailleur_id
LEFT JOIN project_conventions pc ON pc.convention_id = c.id
LEFT JOIN projects p ON p.id = pc.project_id
GROUP BY c.id, c.code, c.name, c.status, c.total_amount, c.disbursed_amount, c.remaining_amount, b.id, b.name;
