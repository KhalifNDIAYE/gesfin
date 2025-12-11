import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectMapData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'suspended' | 'pending' | 'completed' | 'closed';
  start_date: string | null;
  end_date: string | null;
  total_budget: number;
  consumed_budget: number;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  site_id: string | null;
  region_id: string | null;
  responsible?: { id: string; full_name: string } | null;
  site?: { id: string; name: string; country_id?: string } | null;
  region?: { id: string; name: string; latitude: number | null; longitude: number | null } | null;
  currency?: { code: string; symbol: string } | null;
  project_bailleurs?: Array<{
    bailleur: { id: string; name: string; short_name: string; code: string } | null;
    committed_amount: number;
    disbursed_amount: number;
  }>;
  project_conventions?: Array<{
    convention: { id: string; code: string; name: string; total_amount: number } | null;
  }>;
}

export interface MapFilters {
  bailleurId?: string;
  conventionId?: string;
  status?: string;
  siteId?: string;
  startDate?: string;
  endDate?: string;
}

export const useProjectsForMap = (filters?: MapFilters) => {
  return useQuery({
    queryKey: ['projects-map', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          id, code, name, description, status, start_date, end_date,
          total_budget, consumed_budget, latitude, longitude, location_name, site_id, region_id,
          responsible:profiles!projects_responsible_id_fkey(id, full_name),
          site:sites(id, name, country_id),
          region:regions(id, name, latitude, longitude),
          currency:currencies(code, symbol),
          project_bailleurs(
            committed_amount, disbursed_amount,
            bailleur:bailleurs(id, name, short_name, code)
          ),
          project_conventions(
            convention:conventions(id, code, name, total_amount)
          )
        `)
        .order('name');

      // Apply status filter
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Apply site filter
      if (filters?.siteId) {
        query = query.eq('site_id', filters.siteId);
      }

      // Apply date range filter
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      let projects = data as ProjectMapData[];

      // Client-side filter for bailleur (requires checking nested array)
      if (filters?.bailleurId) {
        projects = projects.filter(p => 
          p.project_bailleurs?.some(pb => pb.bailleur?.id === filters.bailleurId)
        );
      }

      // Client-side filter for convention
      if (filters?.conventionId) {
        projects = projects.filter(p => 
          p.project_conventions?.some(pc => pc.convention?.id === filters.conventionId)
        );
      }

      return projects;
    },
  });
};

export const useUpdateProjectLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      latitude, 
      longitude, 
      location_name 
    }: { 
      projectId: string; 
      latitude: number; 
      longitude: number; 
      location_name?: string;
    }) => {
      const { error } = await supabase
        .from('projects')
        .update({ latitude, longitude, location_name })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-map'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Localisation mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useBailleursForFilter = () => {
  return useQuery({
    queryKey: ['bailleurs-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bailleurs')
        .select('id, name, short_name, code')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
};

export const useConventionsForFilter = (bailleurId?: string) => {
  return useQuery({
    queryKey: ['conventions-filter', bailleurId],
    queryFn: async () => {
      let query = supabase
        .from('conventions')
        .select('id, code, name, bailleur_id')
        .eq('status', 'active')
        .order('name');

      if (bailleurId) {
        query = query.eq('bailleur_id', bailleurId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useSitesForFilter = () => {
  return useQuery({
    queryKey: ['sites-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
};

// Status configuration for map markers
export const projectStatusConfig = {
  draft: { 
    label: 'Planifié', 
    color: '#3B82F6', // Blue
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
  },
  pending: { 
    label: 'En attente', 
    color: '#3B82F6', // Blue
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
  },
  active: { 
    label: 'En cours', 
    color: '#22C55E', // Green
    bgClass: 'bg-green-500',
    textClass: 'text-green-500',
  },
  suspended: { 
    label: 'Bloqué', 
    color: '#EF4444', // Red
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
  },
  completed: { 
    label: 'Terminé', 
    color: '#6B7280', // Gray
    bgClass: 'bg-gray-500',
    textClass: 'text-gray-500',
  },
  closed: { 
    label: 'Clôturé', 
    color: '#6B7280', // Gray
    bgClass: 'bg-gray-500',
    textClass: 'text-gray-500',
  },
};
