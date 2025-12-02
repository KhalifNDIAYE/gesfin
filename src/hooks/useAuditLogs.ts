import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ModuleName } from '@/types/database';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  module: string | null;
  resource_type: string | null;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UseAuditLogsOptions {
  userId?: string;
  module?: ModuleName;
  limit?: number;
}

export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const { userId, module, limit = 100 } = options;

  return useQuery({
    queryKey: ['audit-logs', userId, module, limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (module) {
        query = query.eq('module', module);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
};

export const logAction = async (
  action: string,
  module?: ModuleName,
  resourceType?: string,
  resourceId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) => {
  try {
    await supabase.rpc('log_audit_event', {
      _action: action,
      _module: module || null,
      _resource_type: resourceType || null,
      _resource_id: resourceId || null,
      _old_values: oldValues ? JSON.stringify(oldValues) : null,
      _new_values: newValues ? JSON.stringify(newValues) : null,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};
