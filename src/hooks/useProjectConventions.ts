import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectConvention {
  id: string;
  project_id: string;
  convention_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  convention?: {
    id: string;
    code: string;
    name: string;
    status: string;
    total_amount: number;
    disbursed_amount: number;
    remaining_amount: number;
    signing_date: string | null;
    closing_date: string | null;
    bailleur?: { id: string; name: string; short_name: string } | null;
    currency?: { id: string; code: string; symbol: string } | null;
  } | null;
}

export const useProjectConventions = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project-conventions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_conventions')
        .select(`
          *,
          convention:conventions(
            id, code, name, status, total_amount, disbursed_amount, remaining_amount,
            signing_date, closing_date,
            bailleur:bailleurs(id, name, short_name),
            currency:currencies(id, code, symbol)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectConvention[];
    },
    enabled: !!projectId,
  });
};

export const useAddProjectConvention = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, conventionId, notes }: { projectId: string; conventionId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('project_conventions')
        .insert({
          project_id: projectId,
          convention_id: conventionId,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-conventions', variables.projectId] });
      toast.success('Convention ajoutée au projet');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Cette convention est déjà liée au projet');
      } else {
        toast.error(`Erreur: ${error.message}`);
      }
    },
  });
};

export const useRemoveProjectConvention = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_conventions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-conventions', variables.projectId] });
      toast.success('Convention retirée du projet');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useAvailableConventions = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['available-conventions', projectId],
    queryFn: async () => {
      // Get all active conventions
      const { data: allConventions, error: convError } = await supabase
        .from('conventions')
        .select(`
          id, code, name, status, total_amount,
          bailleur:bailleurs(id, name, short_name)
        `)
        .in('status', ['active', 'en_cours', 'draft'])
        .order('name');

      if (convError) throw convError;

      if (!projectId) return allConventions;

      // Get already linked conventions
      const { data: linkedConventions, error: linkedError } = await supabase
        .from('project_conventions')
        .select('convention_id')
        .eq('project_id', projectId);

      if (linkedError) throw linkedError;

      const linkedIds = new Set(linkedConventions?.map(l => l.convention_id) || []);

      // Filter out already linked
      return allConventions?.filter(c => !linkedIds.has(c.id)) || [];
    },
    enabled: true,
  });
};
