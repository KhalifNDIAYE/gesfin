import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanAccount, PlanType } from '@/types/parametrage';

export function usePlanAccounts(planType: PlanType) {
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
}

export function usePlanAccountMutations() {
  const queryClient = useQueryClient();

  const createPlanAccount = useMutation({
    mutationFn: async (account: Omit<PlanAccount, 'id' | 'created_at' | 'updated_at' | 'children'>) => {
      const { data, error } = await supabase
        .from('plan_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plan-accounts', variables.plan_type] });
      toast.success('Compte créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  const updatePlanAccount = useMutation({
    mutationFn: async ({ id, ...account }: Partial<PlanAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('plan_accounts')
        .update(account as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plan-accounts', data.plan_type] });
      toast.success('Compte modifié avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la modification: ${error.message}`);
    },
  });

  const deletePlanAccount = useMutation({
    mutationFn: async (id: string) => {
      // First get the plan_type for cache invalidation
      const { data: account } = await supabase
        .from('plan_accounts')
        .select('plan_type')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('plan_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return account?.plan_type;
    },
    onSuccess: (planType) => {
      if (planType) {
        queryClient.invalidateQueries({ queryKey: ['plan-accounts', planType] });
      }
      toast.success('Compte supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  return { createPlanAccount, updatePlanAccount, deletePlanAccount };
}
