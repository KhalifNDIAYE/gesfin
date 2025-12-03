import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SidebarCounts {
  projets: number;
  bailleurs: number;
  conventions: number;
  marches: number;
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
