import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BudgetFreezeStatus {
  is_frozen: boolean;
  reason: string | null;
  frozen_at?: string | null;
}

export interface ExpenseAllowedStatus {
  allowed: boolean;
  reason: string | null;
}

// Check if a specific budget is frozen
export const useIsBudgetFrozen = (budgetId: string | null) => {
  return useQuery({
    queryKey: ['budget-frozen-status', budgetId],
    queryFn: async (): Promise<BudgetFreezeStatus> => {
      if (!budgetId) return { is_frozen: false, reason: null };
      
      const { data, error } = await supabase.rpc('is_budget_frozen', {
        p_budget_id: budgetId,
      });
      
      if (error) throw error;
      return data as unknown as BudgetFreezeStatus;
    },
    enabled: !!budgetId,
  });
};

// Check if expense creation is allowed for a fiscal year
export const useIsExpenseAllowed = (fiscalYearId: string | null, budgetId?: string | null) => {
  return useQuery({
    queryKey: ['expense-allowed', fiscalYearId, budgetId],
    queryFn: async (): Promise<ExpenseAllowedStatus> => {
      if (!fiscalYearId) return { allowed: true, reason: null };
      
      const { data, error } = await supabase.rpc('check_expense_allowed', {
        p_fiscal_year_id: fiscalYearId,
        p_budget_id: budgetId || null,
      });
      
      if (error) throw error;
      return data as unknown as ExpenseAllowedStatus;
    },
    enabled: !!fiscalYearId,
  });
};

// Get all frozen budgets for a fiscal year
export const useFrozenBudgets = (fiscalYearId: string | null) => {
  return useQuery({
    queryKey: ['frozen-budgets', fiscalYearId],
    queryFn: async () => {
      if (!fiscalYearId) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('id, code, name, is_frozen, frozen_at, frozen_reason, status')
        .eq('fiscal_year_id', fiscalYearId)
        .eq('is_frozen', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!fiscalYearId,
  });
};

// Manually freeze a budget
export const useFreezeBudget = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ budgetId, reason }: { budgetId: string; reason: string }) => {
      const { error } = await supabase
        .from('budgets')
        .update({
          is_frozen: true,
          frozen_at: new Date().toISOString(),
          frozen_reason: reason,
        })
        .eq('id', budgetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['frozen-budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-frozen-status'] });
      toast({ title: 'Budget gelé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
};

// Unfreeze a budget (admin only)
export const useUnfreezeBudget = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('budgets')
        .update({
          is_frozen: false,
          frozen_at: null,
          frozen_reason: null,
        })
        .eq('id', budgetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['frozen-budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-frozen-status'] });
      toast({ title: 'Budget dégelé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
};
