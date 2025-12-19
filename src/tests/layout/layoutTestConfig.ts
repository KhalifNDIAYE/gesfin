/**
 * Configuration des tests visuels de non-régression
 * Définit toutes les pages à tester et les critères de validation
 */

export interface PageTestConfig {
  path: string;
  name: string;
  category: 'dashboard' | 'module' | 'admin' | 'sensitive';
  requiresAuth: boolean;
  requiredRoles?: string[];
  layoutChecks: {
    hasAppLayout: boolean;
    hasHeader: boolean;
    hasSidebar: boolean;
    hasMainContent: boolean;
  };
}

export const PAGES_TO_TEST: PageTestConfig[] = [
  // Tableaux de bord
  {
    path: '/',
    name: 'Tableau de bord principal',
    category: 'dashboard',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/dashboard/direction',
    name: 'Vue Direction',
    category: 'dashboard',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/dashboard/finance',
    name: 'Vue Finance',
    category: 'dashboard',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/dashboard/projet',
    name: 'Vue Projet',
    category: 'dashboard',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Page sensible - Risques Budgétaires
  {
    path: '/budget/risks-dashboard',
    name: 'Tableau de bord Risques Budgétaires',
    category: 'sensitive',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Modules Projets
  {
    path: '/projets',
    name: 'Projets',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/projets/carte',
    name: 'Carte des projets',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Modules Budgets
  {
    path: '/budgets',
    name: 'Budgets',
    category: 'sensitive',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/budget/dashboard',
    name: 'Dashboard Budget',
    category: 'sensitive',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/budget/alerts',
    name: 'Alertes Budget',
    category: 'sensitive',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/budget/transfers',
    name: 'Transferts Budget',
    category: 'sensitive',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/budget/comparison',
    name: 'Comparaison Budget',
    category: 'sensitive',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Conventions
  {
    path: '/conventions',
    name: 'Conventions',
    category: 'sensitive',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Bailleurs
  {
    path: '/bailleurs',
    name: 'Bailleurs',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Comptabilité
  {
    path: '/comptabilite',
    name: 'Comptabilité',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/comptabilite/journal',
    name: 'Journal',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/comptabilite/grand-livre',
    name: 'Grand Livre',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/comptabilite/balances',
    name: 'Balances',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Décaissements
  {
    path: '/decaissements',
    name: 'Décaissements',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/decaissements/monitoring',
    name: 'Monitoring Décaissements',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Immobilisations
  {
    path: '/immobilisations',
    name: 'Immobilisations',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Marchés
  {
    path: '/marches',
    name: 'Marchés',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Rapports
  {
    path: '/rapports',
    name: 'Rapports',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/rapports/dashboard',
    name: 'Dashboard Reporting',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/rapports/risques-alertes',
    name: 'Risques et Alertes',
    category: 'sensitive',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Sécurité
  {
    path: '/securite',
    name: 'Sécurité',
    category: 'admin',
    requiresAuth: true,
    requiredRoles: ['Administrateur'],
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Administration
  {
    path: '/utilisateurs',
    name: 'Utilisateurs',
    category: 'admin',
    requiresAuth: true,
    requiredRoles: ['Administrateur'],
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/parametrage',
    name: 'Paramétrage',
    category: 'admin',
    requiresAuth: true,
    requiredRoles: ['Administrateur'],
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/administration/blocked-actions',
    name: 'Actions Bloquées',
    category: 'admin',
    requiresAuth: true,
    requiredRoles: ['Administrateur'],
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  {
    path: '/administration/utilitaires',
    name: 'Utilitaires',
    category: 'admin',
    requiresAuth: true,
    requiredRoles: ['Administrateur'],
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
  
  // Profil
  {
    path: '/profil',
    name: 'Profil',
    category: 'module',
    requiresAuth: true,
    layoutChecks: { hasAppLayout: true, hasHeader: true, hasSidebar: true, hasMainContent: true },
  },
];

// Catégories de test par rôle
export const ROLE_TEST_CONFIGS = {
  Admin: {
    name: 'Administrateur',
    testCategories: ['dashboard', 'module', 'admin', 'sensitive'],
  },
  Comptable: {
    name: 'Comptable',
    testCategories: ['dashboard', 'module', 'sensitive'],
    excludePaths: ['/securite', '/utilisateurs', '/administration'],
  },
  Auditeur: {
    name: 'Auditeur',
    testCategories: ['dashboard', 'module', 'sensitive'],
    excludePaths: ['/securite', '/utilisateurs', '/administration', '/parametrage'],
  },
};

// Seuils de régression
export const REGRESSION_THRESHOLDS = {
  layoutMissing: 'critical',
  headerMissing: 'critical',
  sidebarMissing: 'critical',
  contentEmpty: 'warning',
  styleDeviation: 'warning',
};
