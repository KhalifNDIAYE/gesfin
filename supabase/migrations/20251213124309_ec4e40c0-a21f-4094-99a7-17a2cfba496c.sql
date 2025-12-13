-- Enable security_invoker on bailleur_stats view to inherit RLS from base tables
ALTER VIEW bailleur_stats SET (security_invoker = on);

-- Enable security_invoker on convention_project_stats view to inherit RLS from base tables
ALTER VIEW convention_project_stats SET (security_invoker = on);