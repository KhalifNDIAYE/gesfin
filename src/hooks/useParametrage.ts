import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  FiscalYear,
  Currency,
  Country,
  Site,
  WorkUnit,
  Location,
  PlanAccount,
  TrackingAxis,
  OrganizationSettings,
  PlanType,
} from '@/types/parametrage';

// Fiscal Years
export const useFiscalYears = () => {
  return useQuery({
    queryKey: ['fiscal-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_years')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as FiscalYear[];
    },
  });
};

export const useFiscalYearMutations = () => {
  const queryClient = useQueryClient();

  const createFiscalYear = useMutation({
    mutationFn: async (data: Omit<FiscalYear, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('fiscal_years').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      toast.success('Exercice créé avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateFiscalYear = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FiscalYear> & { id: string }) => {
      const { error } = await supabase.from('fiscal_years').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      toast.success('Exercice mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteFiscalYear = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fiscal_years').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      toast.success('Exercice supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return { createFiscalYear, updateFiscalYear, deleteFiscalYear };
};

// Currencies
export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('code');
      if (error) throw error;
      return data as Currency[];
    },
  });
};

export const useCurrencyMutations = () => {
  const queryClient = useQueryClient();

  const createCurrency = useMutation({
    mutationFn: async (data: Omit<Currency, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('currencies').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Devise créée avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateCurrency = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Currency> & { id: string }) => {
      const { error } = await supabase.from('currencies').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Devise mise à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteCurrency = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('currencies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Devise supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return { createCurrency, updateCurrency, deleteCurrency };
};

// Countries
export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Country[];
    },
  });
};

export const useCountryMutations = () => {
  const queryClient = useQueryClient();

  const createCountry = useMutation({
    mutationFn: async (data: Omit<Country, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('countries').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Pays créé avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateCountry = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Country> & { id: string }) => {
      const { error } = await supabase.from('countries').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Pays mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteCountry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('countries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Pays supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return { createCountry, updateCountry, deleteCountry };
};

// Sites
export const useSites = () => {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*, country:countries(*)')
        .order('name');
      if (error) throw error;
      return data as Site[];
    },
  });
};

export const useSiteMutations = () => {
  const queryClient = useQueryClient();

  const createSite = useMutation({
    mutationFn: async (data: Omit<Site, 'id' | 'created_at' | 'updated_at' | 'country'>) => {
      const { error } = await supabase.from('sites').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site créé avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateSite = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Site> & { id: string }) => {
      const { country, ...updateData } = data;
      const { error } = await supabase.from('sites').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteSite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return { createSite, updateSite, deleteSite };
};

// Work Units
export const useWorkUnits = () => {
  return useQuery({
    queryKey: ['work-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_units')
        .select('*')
        .order('code');
      if (error) throw error;
      return data as WorkUnit[];
    },
  });
};

export const useWorkUnitMutations = () => {
  const queryClient = useQueryClient();

  const createWorkUnit = useMutation({
    mutationFn: async (data: Omit<WorkUnit, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('work_units').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-units'] });
      toast.success('Unité d\'œuvre créée avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateWorkUnit = useMutation({
    mutationFn: async ({ id, ...data }: Partial<WorkUnit> & { id: string }) => {
      const { error } = await supabase.from('work_units').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-units'] });
      toast.success('Unité d\'œuvre mise à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteWorkUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-units'] });
      toast.success('Unité d\'œuvre supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return { createWorkUnit, updateWorkUnit, deleteWorkUnit };
};

// Locations
export const useLocations = () => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*, site:sites(*)')
        .order('code');
      if (error) throw error;
      return data as Location[];
    },
  });
};

export const useLocationMutations = () => {
  const queryClient = useQueryClient();

  const createLocation = useMutation({
    mutationFn: async (data: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'site'>) => {
      const { error } = await supabase.from('locations').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Emplacement créé avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Location> & { id: string }) => {
      const { site, ...updateData } = data;
      const { error } = await supabase.from('locations').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Emplacement mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Emplacement supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return { createLocation, updateLocation, deleteLocation };
};

// Plan Accounts
export const usePlanAccounts = (planType: PlanType) => {
  return useQuery({
    queryKey: ['plan-accounts', planType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_accounts')
        .select('*')
        .eq('plan_type', planType)
        .order('code');
      if (error) throw error;
      return data as PlanAccount[];
    },
  });
};

export const usePlanAccountMutations = () => {
  const queryClient = useQueryClient();

  const createPlanAccount = useMutation({
    mutationFn: async (data: Omit<PlanAccount, 'id' | 'created_at' | 'updated_at' | 'children'>) => {
      const { error } = await supabase.from('plan_accounts').insert(data);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plan-accounts', variables.plan_type] });
      toast.success('Compte créé avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updatePlanAccount = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PlanAccount> & { id: string }) => {
      const { children, ...updateData } = data;
      const { error } = await supabase.from('plan_accounts').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plan-accounts'] });
      toast.success('Compte mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deletePlanAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plan_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-accounts'] });
      toast.success('Compte supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return { createPlanAccount, updatePlanAccount, deletePlanAccount };
};

// Tracking Axes
export const useTrackingAxes = () => {
  return useQuery({
    queryKey: ['tracking-axes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_axes')
        .select('*')
        .order('code');
      if (error) throw error;
      return data as TrackingAxis[];
    },
  });
};

export const useTrackingAxisMutations = () => {
  const queryClient = useQueryClient();

  const createTrackingAxis = useMutation({
    mutationFn: async (data: Omit<TrackingAxis, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('tracking_axes').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-axes'] });
      toast.success('Axe de suivi créé avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateTrackingAxis = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TrackingAxis> & { id: string }) => {
      const { error } = await supabase.from('tracking_axes').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-axes'] });
      toast.success('Axe de suivi mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteTrackingAxis = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tracking_axes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-axes'] });
      toast.success('Axe de suivi supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return { createTrackingAxis, updateTrackingAxis, deleteTrackingAxis };
};

// Organization Settings
export const useOrganizationSettings = () => {
  return useQuery({
    queryKey: ['organization-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as OrganizationSettings | null;
    },
  });
};

export const useOrganizationSettingsMutations = () => {
  const queryClient = useQueryClient();

  const updateOrganizationSettings = useMutation({
    mutationFn: async ({ id, ...data }: Partial<OrganizationSettings> & { id: string }) => {
      const { error } = await supabase.from('organization_settings').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast.success('Paramètres mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  return { updateOrganizationSettings };
};
