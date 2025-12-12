-- Insert roles if they don't exist
INSERT INTO public.roles (name, description, is_system) VALUES
  ('admin', 'Administrateur - Tous les droits sur tous les modules', true),
  ('dg', 'Directeur Général - Validations finales et dashboards', true),
  ('daf', 'Directeur Financier - Budgets, dépenses, décaissements, conventions', true),
  ('rf', 'Responsable Financier - Saisie et validation niveau 1 finance', true),
  ('cds', 'Chef de Service - Validation hiérarchique des dépenses', true),
  ('comptable', 'Comptable - Saisie et immobilisations', true),
  ('cdp', 'Chef de Projet - Suivi budget et dépenses projet', true),
  ('demandeur', 'Demandeur - Création de demandes uniquement', true),
  ('auditeur', 'Auditeur - Lecture seule et export', true),
  ('admin_sys', 'Administrateur Système - Sauvegardes et logs', true)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Clear existing role permissions for these roles to reassign
DELETE FROM public.role_permissions 
WHERE role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'dg', 'daf', 'rf', 'cds', 'comptable', 'cdp', 'demandeur', 'auditeur', 'admin_sys'));

-- ADMIN: All permissions on all modules
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin';

-- DIRECTEUR GÉNÉRAL: Validate + read dashboards/rapports, read on key modules
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'dg' AND (
  (p.module = 'dashboard' AND p.permission IN ('read', 'export')) OR
  (p.module = 'rapports' AND p.permission IN ('read', 'export')) OR
  (p.module = 'projets' AND p.permission IN ('read', 'validate', 'export')) OR
  (p.module = 'comptabilite' AND p.permission IN ('read', 'validate', 'export')) OR
  (p.module = 'conventions' AND p.permission IN ('read', 'validate', 'export')) OR
  (p.module = 'decaissements' AND p.permission IN ('read', 'validate', 'export')) OR
  (p.module = 'bailleurs' AND p.permission IN ('read', 'export')) OR
  (p.module = 'marches' AND p.permission IN ('read', 'validate', 'export')) OR
  (p.module = 'immobilisations' AND p.permission IN ('read', 'export'))
);

-- DIRECTEUR FINANCIER: Full on budgets, expenses, disbursements, conventions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'daf' AND (
  (p.module = 'dashboard' AND p.permission IN ('read', 'export')) OR
  (p.module = 'rapports' AND p.permission IN ('read', 'export')) OR
  (p.module = 'comptabilite' AND p.permission IN ('read', 'create', 'update', 'delete', 'validate', 'export')) OR
  (p.module = 'conventions' AND p.permission IN ('read', 'create', 'update', 'delete', 'validate', 'export')) OR
  (p.module = 'decaissements' AND p.permission IN ('read', 'create', 'update', 'delete', 'validate', 'export')) OR
  (p.module = 'bailleurs' AND p.permission IN ('read', 'create', 'update', 'export')) OR
  (p.module = 'projets' AND p.permission IN ('read', 'export')) OR
  (p.module = 'marches' AND p.permission IN ('read', 'validate', 'export')) OR
  (p.module = 'immobilisations' AND p.permission IN ('read', 'create', 'update', 'validate', 'export'))
);

-- RESPONSABLE FINANCIER: Create, read, update on finance modules, validate level 1
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'rf' AND (
  (p.module = 'dashboard' AND p.permission = 'read') OR
  (p.module = 'comptabilite' AND p.permission IN ('read', 'create', 'update', 'validate', 'export')) OR
  (p.module = 'conventions' AND p.permission IN ('read', 'create', 'update', 'export')) OR
  (p.module = 'decaissements' AND p.permission IN ('read', 'create', 'update', 'validate', 'export')) OR
  (p.module = 'bailleurs' AND p.permission IN ('read', 'export')) OR
  (p.module = 'projets' AND p.permission = 'read') OR
  (p.module = 'rapports' AND p.permission IN ('read', 'export'))
);

-- CHEF DE SERVICE: Validate expenses hierarchically
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'cds' AND (
  (p.module = 'dashboard' AND p.permission = 'read') OR
  (p.module = 'comptabilite' AND p.permission IN ('read', 'validate', 'export')) OR
  (p.module = 'decaissements' AND p.permission IN ('read', 'validate', 'export')) OR
  (p.module = 'projets' AND p.permission IN ('read', 'export')) OR
  (p.module = 'rapports' AND p.permission IN ('read', 'export'))
);

-- COMPTABLE: Create, read, update on accounting and assets
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'comptable' AND (
  (p.module = 'dashboard' AND p.permission = 'read') OR
  (p.module = 'comptabilite' AND p.permission IN ('read', 'create', 'update', 'export')) OR
  (p.module = 'immobilisations' AND p.permission IN ('read', 'create', 'update', 'export')) OR
  (p.module = 'decaissements' AND p.permission IN ('read', 'create', 'update', 'export')) OR
  (p.module = 'conventions' AND p.permission = 'read') OR
  (p.module = 'projets' AND p.permission = 'read') OR
  (p.module = 'rapports' AND p.permission IN ('read', 'export'))
);

-- CHEF DE PROJET: Project budget and expense tracking
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'cdp' AND (
  (p.module = 'dashboard' AND p.permission = 'read') OR
  (p.module = 'projets' AND p.permission IN ('read', 'create', 'update', 'export')) OR
  (p.module = 'comptabilite' AND p.permission IN ('read', 'create', 'export')) OR
  (p.module = 'conventions' AND p.permission IN ('read', 'export')) OR
  (p.module = 'decaissements' AND p.permission IN ('read', 'create', 'export')) OR
  (p.module = 'marches' AND p.permission IN ('read', 'create', 'update', 'export')) OR
  (p.module = 'rapports' AND p.permission IN ('read', 'export'))
);

-- DEMANDEUR: Create requests only
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'demandeur' AND (
  (p.module = 'dashboard' AND p.permission = 'read') OR
  (p.module = 'comptabilite' AND p.permission IN ('read', 'create')) OR
  (p.module = 'decaissements' AND p.permission IN ('read', 'create')) OR
  (p.module = 'projets' AND p.permission = 'read')
);

-- AUDITEUR: Read-only + export on all modules
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'auditeur' AND p.permission IN ('read', 'export');

-- ADMINISTRATEUR SYSTÈME: Security, settings, logs
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin_sys' AND (
  (p.module = 'securite' AND p.permission IN ('read', 'create', 'update', 'delete', 'export')) OR
  (p.module = 'parametres' AND p.permission IN ('read', 'create', 'update', 'delete', 'export')) OR
  (p.module = 'utilisateurs' AND p.permission IN ('read', 'export')) OR
  (p.module = 'dashboard' AND p.permission = 'read')
);