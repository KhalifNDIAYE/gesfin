import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type NotificationType = 'budget_overrun' | 'project_late' | 'convention_expired' | 'blocked_action' | 'validation_pending' | 'backup_status' | 'system_info';
export type NotificationSeverity = 'info' | 'warning' | 'critical';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  module: string | null;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  related_entity_name: string | null;
  direct_link: string | null;
  triggered_by: string | null;
  status: NotificationStatus;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
}

interface NotificationFilters {
  type?: NotificationType;
  severity?: NotificationSeverity;
  status?: NotificationStatus;
  startDate?: string;
  endDate?: string;
}

export const useNotifications = (filters?: NotificationFilters) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id, filters],
    queryFn: async () => {
      let q = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        q = q.eq('type', filters.type);
      }
      if (filters?.severity) {
        q = q.eq('severity', filters.severity);
      }
      if (filters?.status) {
        q = q.eq('status', filters.status);
      }
      if (filters?.startDate) {
        q = q.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        q = q.lte('created_at', filters.endDate);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
          
          const notification = payload.new as Notification;
          const severityIcons = {
            critical: '🔴',
            warning: '🟠',
            info: '🔵',
          };
          toast(notification.title, {
            description: notification.message,
            icon: severityIcons[notification.severity],
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
};

export const useUnreadNotificationsCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('status', 'unread');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  const archiveNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  return { markAsRead, markAllAsRead, archiveNotification, deleteNotification };
};

// Helper function to create a notification
export const createNotification = async (params: {
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  module: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityName?: string;
  directLink?: string;
  triggeredBy?: string;
}) => {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    severity: params.severity,
    module: params.module,
    title: params.title,
    message: params.message,
    related_entity_type: params.relatedEntityType,
    related_entity_id: params.relatedEntityId,
    related_entity_name: params.relatedEntityName,
    direct_link: params.directLink,
    triggered_by: params.triggeredBy,
  });

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
