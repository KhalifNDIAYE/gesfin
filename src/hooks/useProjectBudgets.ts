import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectBudget {
  id: string;
  project_id: string;
  budget_id: string;
  forecast_amount: number;
  committed_amount: number;
  consumed_amount: number;
  remaining_amount: number;
  fiscal_year_id: string | null;
  created_at: string;
  updated_at: string;
  budget?: {
    id: string;
    code: string;
    name: string;
    status: string;
    total_amount: number;
    currency?: { id: string; code: string; symbol: string } | null;
    fiscal_year?: { id: string; name: string; start_date: string; end_date: string } | null;
  } | null;
}

export const useProjectBudgets = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project-budgets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_budgets')
        .select(`
          *,
          budget:budgets(
            id, code, name, status, total_amount,
            currency:currencies(id, code, symbol),
            fiscal_year:fiscal_years(id, name, start_date, end_date)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectBudget[];
    },
    enabled: !!projectId,
  });
};
