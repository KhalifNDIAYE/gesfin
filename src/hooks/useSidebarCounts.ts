import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sidebar-alerts', user?.id],
    queryFn: async (): Promise<SidebarAlerts> => {
      // Get alerts from the unified notifications table
      // This ensures badges and notification center are synchronized
      const { data, error } = await supabase
        .from('notifications')
        .select('type, related_entity_type, related_entity_id')
        .eq('status', 'unread');

      if (error) throw error;

      // Count unique entities per alert type to avoid counting duplicates
      const projectsLate = new Set<string>();
      const projectsBudgetOverrun = new Set<string>();
      const conventionsExpired = new Set<string>();
      const budgetLinesOverdrawn = new Set<string>();

      data?.forEach(n => {
        if (n.type === 'project_late' && n.related_entity_type === 'project' && n.related_entity_id) {
          projectsLate.add(n.related_entity_id);
        }
        if (n.type === 'budget_overrun' && n.related_entity_type === 'project' && n.related_entity_id) {
          projectsBudgetOverrun.add(n.related_entity_id);
        }
        if (n.type === 'convention_expired' && n.related_entity_type === 'convention' && n.related_entity_id) {
          conventionsExpired.add(n.related_entity_id);
        }
        if (n.type === 'budget_overrun' && n.related_entity_type === 'budget_line' && n.related_entity_id) {
          budgetLinesOverdrawn.add(n.related_entity_id);
        }
      });

      return {
        projetsEnRetard: projectsLate.size,
        projetsBudgetDepasse: projectsBudgetOverrun.size,
        conventionsExpirees: conventionsExpired.size,
        budgetsEnDepassement: budgetLinesOverdrawn.size,
      };
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
};
