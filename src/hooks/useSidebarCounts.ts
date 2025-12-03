import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SidebarCounts {
  projets: number;
  bailleurs: number;
  conventions: number;
  marches: number;
}

export interface SidebarAlerts {
  projetsEnRetard: number;
  projetsBudgetDepasse: number;
  conventionsExpirees: number;
  budgetsEnDepassement: number;
}

export const useSidebarCounts = () => {
  return useQuery({
    queryKey: ['sidebar-counts'],
    queryFn: async (): Promise<SidebarCounts> => {
      // Fetch all counts in parallel for performance
      const [projetsResult, bailleursResult, conventionsResult, marchesResult] = await Promise.all([
        // Count active projects (status = 'active')
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        
        // Count all bailleurs
        supabase
          .from('bailleurs')
          .select('id', { count: 'exact', head: true }),
        
        // Count active conventions (status = 'active')
        supabase
          .from('conventions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        
        // Count active contracts (status = 'in_progress' or 'active')
        supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .in('status', ['in_progress', 'active']),
      ]);

      return {
        projets: projetsResult.count ?? 0,
        bailleurs: bailleursResult.count ?? 0,
        conventions: conventionsResult.count ?? 0,
        marches: marchesResult.count ?? 0,
      };
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useSidebarAlerts = () => {
  return useQuery({
    queryKey: ['sidebar-alerts'],
    queryFn: async (): Promise<SidebarAlerts> => {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all alert counts in parallel
      const [
        projetsEnRetardResult,
        projetsBudgetDepasseResult,
        conventionsExpireesResult,
        budgetsEnDepassementResult,
      ] = await Promise.all([
        // Projects en retard: end_date < today AND status NOT IN ('completed', 'closed', 'cancelled')
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .lt('end_date', today)
          .not('status', 'in', '("completed","closed","cancelled")'),
        
        // Projects with budget overrun: consumed_budget > total_budget
        supabase
          .from('projects')
          .select('id, total_budget, consumed_budget')
          .not('total_budget', 'is', null)
          .not('consumed_budget', 'is', null),
        
        // Conventions expirées: closing_date < today AND status = 'active'
        supabase
          .from('conventions')
          .select('id', { count: 'exact', head: true })
          .lt('closing_date', today)
          .eq('status', 'active'),
        
        // Budget lines en dépassement (where realized > forecast)
        supabase
          .from('budget_lines')
          .select('id, forecast_amount, realized_amount')
          .not('forecast_amount', 'is', null)
          .gt('forecast_amount', 0),
      ]);

      // Calculate budget overruns for projects (client-side filtering)
      let projetsBudgetDepasse = 0;
      if (projetsBudgetDepasseResult.data) {
        projetsBudgetDepasse = projetsBudgetDepasseResult.data.filter(
          (p) => p.consumed_budget !== null && p.total_budget !== null && p.consumed_budget > p.total_budget
        ).length;
      }

      // Calculate budget line overruns (client-side filtering)
      let budgetsEnDepassement = 0;
      if (budgetsEnDepassementResult.data) {
        budgetsEnDepassement = budgetsEnDepassementResult.data.filter(
          (b) => b.realized_amount !== null && b.forecast_amount !== null && b.realized_amount > b.forecast_amount
        ).length;
      }

      return {
        projetsEnRetard: projetsEnRetardResult.count ?? 0,
        projetsBudgetDepasse,
        conventionsExpirees: conventionsExpireesResult.count ?? 0,
        budgetsEnDepassement,
      };
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
};
