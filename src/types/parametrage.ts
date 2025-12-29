// Parametrage types
export type PlanType = 'comptable' | 'budgetaire' | 'analytique' | 'financier' | 'geographique';

export interface FiscalYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  is_default: boolean;
  exchange_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  code: string;
  name: string;
  address: string | null;
  country_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  country?: Country;
}

export interface WorkUnit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  site_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  site?: Site;
}

export interface PlanAccount {
  id: string;
  plan_type: PlanType;
  code: string;
  name: string;
  parent_id: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: PlanAccount[];
}

export interface TrackingAxis {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  name: string;
  acronym: string | null;
  address: string | null;
  country_id: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  tax_id: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  created_at: string;
  updated_at: string;
}

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  comptable: 'Plan Comptable',
  budgetaire: 'Plan Budgétaire',
  analytique: 'Plan Analytique',
  financier: 'Plan Financier',
  geographique: 'Plan Géographique',
};
