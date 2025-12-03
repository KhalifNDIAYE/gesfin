import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlockedAction {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  user_roles: string[];
  ip_address: string;
  user_agent: string;
  browser: string;
  operating_system: string;
  device_type: string;
  module: string;
  action_attempted: string;
  resource_type: string | null;
  resource_id: string | null;
  permission_required: string;
  permissions_held: string[];
  status: string;
  timestamp: string;
  timezone: string;
  block_source: string;
  request_url: string;
  request_method: string;
  severity: string;
  additional_context: Record<string, any> | null;
  created_at: string;
}

interface BlockedActionsFilters {
  userId?: string;
  module?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const useBlockedActions = (filters?: BlockedActionsFilters) => {
  return useQuery({
    queryKey: ['blocked-actions', filters],
    queryFn: async () => {
      let query = supabase
        .from('security_blocked_actions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.module) {
        query = query.eq('module', filters.module);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }
      if (filters?.search) {
        query = query.or(`user_email.ilike.%${filters.search}%,user_full_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BlockedAction[];
    },
  });
};

export const useBlockedActionsStats = () => {
  return useQuery({
    queryKey: ['blocked-actions-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_blocked_actions')
        .select('severity, module, timestamp');

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      const stats = {
        total: data?.length || 0,
        today: data?.filter(a => new Date(a.timestamp) >= today).length || 0,
        thisWeek: data?.filter(a => new Date(a.timestamp) >= thisWeek).length || 0,
        critical: data?.filter(a => a.severity === 'critical').length || 0,
        medium: data?.filter(a => a.severity === 'medium').length || 0,
        low: data?.filter(a => a.severity === 'low').length || 0,
        byModule: {} as Record<string, number>,
      };

      data?.forEach(action => {
        if (!stats.byModule[action.module]) {
          stats.byModule[action.module] = 0;
        }
        stats.byModule[action.module]++;
      });

      return stats;
    },
  });
};
