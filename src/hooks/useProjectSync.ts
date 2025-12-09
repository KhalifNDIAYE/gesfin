import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectKPIs {
  project_id: string;
  project_code: string;
  project_name: string;
  status: string;
  total_budget: number;
  consumed_budget: number;
  available_budget: number;
  execution_rate: number;
  convention_count: number;
  bailleur_count: number;
  total_from_conventions: number;
  disbursed_from_conventions: number;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number | null;
  is_overdue: boolean;
}

export interface BailleurStats {
  bailleur_id: string;
  bailleur_code: string;
  bailleur_name: string;
  short_name: string | null;
  is_active: boolean;
  convention_count: number;
  project_count: number;
  total_committed: number;
  total_disbursed: number;
  total_remaining: number;
  global_execution_rate: number;
}

export interface ConventionProjectStats {
  convention_id: string;
  convention_code: string;
  convention_name: string;
  status: string;
  total_amount: number;
  disbursed_amount: number;
  remaining_amount: number;
  bailleur_id: string | null;
  bailleur_name: string | null;
  linked_projects_count: number;
  project_names: string[] | null;
  execution_rate: number;
}

// Hook pour récupérer les KPIs d'un projet
export const useProjectKPIs = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project-kpis', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase.rpc('get_project_kpis', {
        _project_id: projectId
      });
      if (error) throw error;
      return data as unknown as ProjectKPIs;
    },
    enabled: !!projectId,
  });
};

// Hook pour récupérer les statistiques des bailleurs
export const useBailleurStats = () => {
  return useQuery({
    queryKey: ['bailleur-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bailleur_stats')
        .select('*')
        .order('bailleur_name');
      if (error) throw error;
      return data as BailleurStats[];
    },
  });
};

// Hook pour récupérer les statistiques des conventions avec projets
export const useConventionProjectStats = () => {
  return useQuery({
    queryKey: ['convention-project-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('convention_project_stats')
        .select('*')
        .order('convention_name');
      if (error) throw error;
      return data as ConventionProjectStats[];
    },
  });
};

// Hook pour forcer une synchronisation manuelle des bailleurs d'un projet
export const useSyncProjectBailleurs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.rpc('sync_project_bailleurs_from_conventions', {
        _project_id: projectId
      });
      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-conventions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-kpis', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Synchronisation des bailleurs effectuée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    },
  });
};

// Hook pour forcer un recalcul des KPIs d'un projet
export const useRecalculateProjectKPIs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.rpc('recalculate_project_kpis', {
        _project_id: projectId
      });
      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-kpis', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('KPIs recalculés');
    },
    onError: (error: Error) => {
      toast.error(`Erreur de recalcul: ${error.message}`);
    },
  });
};

// Hook pour récupérer les bailleurs dérivés des conventions d'un projet
export const useProjectDerivedBailleurs = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project-derived-bailleurs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Récupérer les conventions du projet avec leurs bailleurs
      const { data, error } = await supabase
        .from('project_conventions')
        .select(`
          convention_id,
          convention:conventions(
            id, code, name, total_amount, disbursed_amount, remaining_amount,
            bailleur:bailleurs(id, code, name, short_name)
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      // Agréger par bailleur
      const bailleurMap = new Map<string, {
        bailleur_id: string;
        bailleur_code: string;
        bailleur_name: string;
        short_name: string | null;
        conventions: Array<{ id: string; code: string; name: string }>;
        total_committed: number;
        total_disbursed: number;
        total_remaining: number;
      }>();

      data?.forEach((pc: any) => {
        const conv = pc.convention;
        if (!conv?.bailleur) return;

        const b = conv.bailleur;
        const existing = bailleurMap.get(b.id);

        if (existing) {
          existing.total_committed += conv.total_amount || 0;
          existing.total_disbursed += conv.disbursed_amount || 0;
          existing.total_remaining += conv.remaining_amount || 0;
          existing.conventions.push({ id: conv.id, code: conv.code, name: conv.name });
        } else {
          bailleurMap.set(b.id, {
            bailleur_id: b.id,
            bailleur_code: b.code,
            bailleur_name: b.name,
            short_name: b.short_name,
            conventions: [{ id: conv.id, code: conv.code, name: conv.name }],
            total_committed: conv.total_amount || 0,
            total_disbursed: conv.disbursed_amount || 0,
            total_remaining: conv.remaining_amount || 0,
          });
        }
      });

      return Array.from(bailleurMap.values()).map(b => ({
        ...b,
        execution_rate: b.total_committed > 0 ? (b.total_disbursed / b.total_committed) * 100 : 0
      }));
    },
    enabled: !!projectId,
  });
};
