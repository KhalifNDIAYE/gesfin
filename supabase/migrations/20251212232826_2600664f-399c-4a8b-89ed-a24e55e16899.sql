-- Supprimer les anciens rôles en doublon (dt, lecture, gestionnaire)
-- Garder uniquement les 10 rôles demandés

-- D'abord supprimer les permissions des rôles à supprimer
DELETE FROM role_permissions 
WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('dt', 'lecture', 'gestionnaire')
);

-- Supprimer les affectations utilisateurs des rôles à supprimer
DELETE FROM user_roles 
WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('dt', 'lecture', 'gestionnaire')
);

-- Supprimer les destinataires d'alertes liés aux rôles à supprimer
DELETE FROM budget_alert_recipients 
WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('dt', 'lecture', 'gestionnaire')
);

-- Supprimer les rôles en doublon
DELETE FROM roles WHERE name IN ('dt', 'lecture', 'gestionnaire');

-- Mettre à jour les descriptions des 10 rôles restants pour cohérence
UPDATE roles SET 
  description = 'Administrateur - Tous les droits sur tous les modules'
WHERE name = 'admin';

UPDATE roles SET 
  description = 'Directeur Général - Validations finales et dashboards'
WHERE name = 'dg';

UPDATE roles SET 
  description = 'Directeur Financier - Budgets, dépenses, décaissements, conventions'
WHERE name = 'daf';

UPDATE roles SET 
  description = 'Responsable Financier - Saisie et validation niveau 1 finance'
WHERE name = 'rf';

UPDATE roles SET 
  description = 'Chef de Service - Validation hiérarchique des dépenses'
WHERE name = 'cds';

UPDATE roles SET 
  description = 'Comptable - Saisie et immobilisations'
WHERE name = 'comptable';

UPDATE roles SET 
  description = 'Chef de Projet - Suivi budget et dépenses projet'
WHERE name = 'cdp';

UPDATE roles SET 
  description = 'Demandeur - Création de demandes uniquement'
WHERE name = 'demandeur';

UPDATE roles SET 
  description = 'Auditeur - Lecture seule et export'
WHERE name = 'auditeur';

UPDATE roles SET 
  description = 'Administrateur Système - Sauvegardes et logs'
WHERE name = 'admin_sys';