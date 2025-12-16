import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export type AlertSeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AlertCategory = 'authentication' | 'authorization' | 'data_access' | 'system' | 'compliance';
export type AlertStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'ignored' | 'escalated';
export type AlertActionType = 'block_account' | 'force_logout' | 'reset_password' | 'disable_access' | 'send_notification' | 'send_email' | 'send_webhook' | 'escalate' | 'log_only';

export interface SecurityAlertRule {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: AlertCategory;
  severity: AlertSeverityLevel;
  risk_score: number;
  event_type: string;
  threshold_count: number;
  threshold_window_minutes: number;
  conditions: Record<string, any>;
  whitelist_ips: string[] | null;
  blacklist_ips: string[] | null;
  whitelist_users: string[] | null;
  blacklist_users: string[] | null;
  auto_actions: AlertActionType[];
  auto_action_config: Record<string, any>;
  notify_channels: string[];
  notify_roles: string[] | null;
  is_enabled: boolean;
  cooldown_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface SecurityAlertEvent {
  id: string;
  rule_id: string | null;
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverityLevel;
  risk_score: number;
  status: AlertStatus;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location: string | null;
  country_code: string | null;
  event_type: string;
  event_data: Record<string, any>;
  triggered_conditions: Record<string, any>;
  evidence: Record<string, any>;
  assigned_to: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  actions_taken: string[] | null;
  escalated_to: string | null;
  escalated_at: string | null;
  source_module: string | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityAlertHistory {
  id: string;
  alert_id: string;
  action: string;
  from_status: AlertStatus | null;
  to_status: AlertStatus | null;
  comment: string | null;
  performed_by: string | null;
  performed_at: string;
  metadata: Record<string, any>;
}

export interface EngineConfig {
  id: string;
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
}

// ========================
// HOOKS: Règles d'alertes
// ========================
export const useAlertRules = (category?: AlertCategory) => {
  return useQuery({
    queryKey: ['security-alert-rules', category],
    queryFn: async () => {
      let query = supabase
        .from('security_alert_rules')
        .select('*')
        .order('severity', { ascending: false });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityAlertRule[];
    },
  });
};

export const useAlertRuleMutations = () => {
  const queryClient = useQueryClient();
  
  const createRule = useMutation({
    mutationFn: async (rule: Partial<SecurityAlertRule>) => {
      const { data, error } = await supabase
        .from('security_alert_rules')
        .insert([rule as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alert-rules'] });
      toast.success('Règle créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la règle');
    },
  });
  
  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SecurityAlertRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('security_alert_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alert-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
  
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('security_alert_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alert-rules'] });
      toast.success('Règle supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
  
  const toggleRule = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('security_alert_rules')
        .update({ is_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { is_enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['security-alert-rules'] });
      toast.success(is_enabled ? 'Règle activée' : 'Règle désactivée');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
  
  return { createRule, updateRule, deleteRule, toggleRule };
};

// ========================
// HOOKS: Événements d'alertes
// ========================
export const useAlertEvents = (filters?: {
  status?: AlertStatus;
  severity?: AlertSeverityLevel;
  category?: AlertCategory;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['security-alert-events', filters],
    queryFn: async () => {
      let query = supabase
        .from('security_alert_events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityAlertEvent[];
    },
  });
};

export const useAlertEventMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const updateStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      comment 
    }: { 
      id: string; 
      status: AlertStatus; 
      comment?: string;
    }) => {
      const { data, error } = await supabase.rpc('update_alert_status', {
        p_alert_id: id,
        p_new_status: status,
        p_comment: comment || null,
        p_user_id: user?.id || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alert-events'] });
      queryClient.invalidateQueries({ queryKey: ['alert-engine-stats'] });
      toast.success('Statut mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
  
  const assignAlert = useMutation({
    mutationFn: async ({ id, assigned_to }: { id: string; assigned_to: string }) => {
      const { error } = await supabase
        .from('security_alert_events')
        .update({ assigned_to })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alert-events'] });
      toast.success('Alerte assignée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'assignation');
    },
  });
  
  const addComment = useMutation({
    mutationFn: async ({ alert_id, comment }: { alert_id: string; comment: string }) => {
      const { error } = await supabase
        .from('security_alert_history')
        .insert({
          alert_id,
          action: 'comment',
          comment,
          performed_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alert-history'] });
      toast.success('Commentaire ajouté');
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout du commentaire');
    },
  });
  
  return { updateStatus, assignAlert, addComment };
};

// ========================
// HOOKS: Historique
// ========================
export const useAlertHistory = (alertId: string) => {
  return useQuery({
    queryKey: ['security-alert-history', alertId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alert_history')
        .select('*')
        .eq('alert_id', alertId)
        .order('performed_at', { ascending: false });
      if (error) throw error;
      return data as SecurityAlertHistory[];
    },
    enabled: !!alertId,
  });
};

// ========================
// HOOKS: Configuration
// ========================
export const useEngineConfig = () => {
  return useQuery({
    queryKey: ['engine-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_engine_config')
        .select('*');
      if (error) throw error;
      
      const configMap: Record<string, any> = {};
      data?.forEach((item: EngineConfig) => {
        configMap[item.key] = JSON.parse(JSON.stringify(item.value));
      });
      return configMap;
    },
  });
};

export const useUpdateEngineConfig = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('security_engine_config')
        .update({ value, updated_by: user?.id })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engine-config'] });
      toast.success('Configuration mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
};

// ========================
// HOOKS: Statistiques
// ========================
export const useAlertEngineStats = () => {
  return useQuery({
    queryKey: ['alert-engine-stats'],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('security_alert_events')
        .select('id, severity, status, category, created_at, resolved_at');
      
      if (error) throw error;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const totalAlerts = events?.length || 0;
      const openAlerts = events?.filter(e => !['resolved', 'ignored'].includes(e.status)).length || 0;
      const resolvedAlerts = events?.filter(e => e.status === 'resolved').length || 0;
      
      // Par sévérité
      const bySeverity = {
        critical: events?.filter(e => e.severity === 'critical' && !['resolved', 'ignored'].includes(e.status)).length || 0,
        high: events?.filter(e => e.severity === 'high' && !['resolved', 'ignored'].includes(e.status)).length || 0,
        medium: events?.filter(e => e.severity === 'medium' && !['resolved', 'ignored'].includes(e.status)).length || 0,
        low: events?.filter(e => e.severity === 'low' && !['resolved', 'ignored'].includes(e.status)).length || 0,
        info: events?.filter(e => e.severity === 'info' && !['resolved', 'ignored'].includes(e.status)).length || 0,
      };
      
      // Par catégorie
      const byCategory: Record<string, number> = {};
      events?.forEach(e => {
        if (!byCategory[e.category]) byCategory[e.category] = 0;
        byCategory[e.category]++;
      });
      
      // Par statut
      const byStatus: Record<string, number> = {};
      events?.forEach(e => {
        if (!byStatus[e.status]) byStatus[e.status] = 0;
        byStatus[e.status]++;
      });
      
      // Temps moyen de résolution
      const resolvedEvents = events?.filter(e => e.resolved_at);
      let avgResolutionTime = 0;
      if (resolvedEvents && resolvedEvents.length > 0) {
        const totalTime = resolvedEvents.reduce((sum, e) => {
          const created = new Date(e.created_at).getTime();
          const resolved = new Date(e.resolved_at!).getTime();
          return sum + (resolved - created);
        }, 0);
        avgResolutionTime = Math.round(totalTime / resolvedEvents.length / (1000 * 60)); // en minutes
      }
      
      // Alertes récentes
      const alertsToday = events?.filter(e => new Date(e.created_at) >= today).length || 0;
      const alertsThisWeek = events?.filter(e => new Date(e.created_at) >= thisWeek).length || 0;
      const alertsThisMonth = events?.filter(e => new Date(e.created_at) >= thisMonth).length || 0;
      
      // Tendance (comparison avec la semaine précédente)
      const lastWeek = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
      const alertsLastWeek = events?.filter(e => {
        const date = new Date(e.created_at);
        return date >= lastWeek && date < thisWeek;
      }).length || 0;
      const weekTrend = alertsLastWeek > 0 
        ? ((alertsThisWeek - alertsLastWeek) / alertsLastWeek * 100).toFixed(1) 
        : '0';
      
      return {
        totalAlerts,
        openAlerts,
        resolvedAlerts,
        bySeverity,
        byCategory,
        byStatus,
        avgResolutionTime,
        alertsToday,
        alertsThisWeek,
        alertsThisMonth,
        weekTrend: parseFloat(weekTrend),
      };
    },
  });
};

// ========================
// Fonction utilitaire: Créer une alerte
// ========================
export const triggerSecurityAlert = async (
  ruleCode: string,
  context: {
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    eventData?: Record<string, any>;
    evidence?: Record<string, any>;
  }
) => {
  const { data, error } = await supabase.rpc('create_security_alert', {
    p_rule_code: ruleCode,
    p_user_id: context.userId || null,
    p_user_email: context.userEmail || null,
    p_ip_address: context.ipAddress || null,
    p_user_agent: context.userAgent || null,
    p_event_data: context.eventData || {},
    p_evidence: context.evidence || {},
  });
  
  if (error) {
    console.error('Error creating security alert:', error);
    return null;
  }
  
  return data;
};
