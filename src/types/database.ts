// Database enum types
export type ModuleName = 
  | 'dashboard' 
  | 'projets' 
  | 'comptabilite' 
  | 'bailleurs' 
  | 'conventions' 
  | 'immobilisations' 
  | 'marches' 
  | 'decaissements' 
  | 'rapports' 
  | 'utilisateurs' 
  | 'securite' 
  | 'parametres';

export type PermissionType = 'read' | 'create' | 'update' | 'delete';

export const MODULE_NAMES: ModuleName[] = [
  'dashboard',
  'projets',
  'comptabilite',
  'bailleurs',
  'conventions',
  'immobilisations',
  'marches',
  'decaissements',
  'rapports',
  'utilisateurs',
  'securite',
  'parametres',
];

export const PERMISSION_TYPES: PermissionType[] = ['read', 'create', 'update', 'delete'];
