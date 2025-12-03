import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'active' | 'suspended' | 'pending' | 'completed' | 'closed';
  total_budget: number;
  consumed_budget: number;
  currency_id: string | null;
  exchange_rate: number;
  responsible_id: string | null;
  site_id: string | null;
  tracking_axis_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  responsible?: { id: string; full_name: string; email: string } | null;
  currency?: { id: string; code: string; symbol: string } | null;
  site?: { id: string; name: string } | null;
  project_bailleurs?: ProjectBailleur[];
}

export interface ProjectBailleur {
  id: string;
  project_id: string;
  bailleur_id: string;
  committed_amount: number;
  disbursed_amount: number;
  remaining_amount: number;
  execution_rate: number;
  convention_id: string | null;
  notes: string | null;
  bailleur?: { id: string; name: string; short_name: string; code: string } | null;
}

export interface ProjectFormData {
  code: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  total_budget?: number;
  currency_id?: string;
  responsible_id?: string;
  site_id?: string;
  tracking_axis_id?: string;
  notes?: string;
}

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          responsible:profiles!projects_responsible_id_fkey(id, full_name, email),
          currency:currencies(id, code, symbol),
          site:sites(id, name),
          project_bailleurs(
            id, bailleur_id, committed_amount, disbursed_amount, remaining_amount, execution_rate,
            bailleur:bailleurs(id, name, short_name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });

  const createProject = useMutation({
    mutationFn: async (formData: ProjectFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...formData,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...formData }: ProjectFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
  };
};

export const useProject = (id: string | undefined) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          responsible:profiles!projects_responsible_id_fkey(id, full_name, email),
          currency:currencies(id, code, symbol),
          site:sites(id, name),
          project_bailleurs(
            id, bailleur_id, committed_amount, disbursed_amount, remaining_amount, execution_rate, notes,
            bailleur:bailleurs(id, name, short_name, code)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });
};
