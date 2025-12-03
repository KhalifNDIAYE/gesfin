import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailNotificationSettings {
  id: string;
  is_enabled: boolean;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string | null;
  from_email: string | null;
  from_name: string | null;
  organization_logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailAlertType {
  id: string;
  alert_type: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  send_immediately: boolean;
  severity: 'critical' | 'major' | 'warning';
  created_at: string;
  email_alert_recipients?: { role_id: string }[];
}

export interface EmailLog {
  id: string;
  alert_type: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_preview: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  related_module: string | null;
  related_entity_id: string | null;
  related_entity_name: string | null;
  sent_at: string | null;
  created_at: string;
}

export const useEmailNotificationSettings = () => {
  return useQuery({
    queryKey: ['email-notification-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_notification_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data as EmailNotificationSettings;
    },
  });
};

export const useEmailAlertTypes = () => {
  return useQuery({
    queryKey: ['email-alert-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_alert_types')
        .select('*, email_alert_recipients(role_id)')
        .order('severity', { ascending: true });

      if (error) throw error;
      return data as EmailAlertType[];
    },
  });
};

export const useEmailLogs = (limit = 50) => {
  return useQuery({
    queryKey: ['email-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as EmailLog[];
    },
  });
};

export const useEmailNotificationMutations = () => {
  const queryClient = useQueryClient();

  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<EmailNotificationSettings>) => {
      const { data: existing } = await supabase
        .from('email_notification_settings')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('email_notification_settings')
          .update(settings)
          .eq('id', existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-notification-settings'] });
      toast.success('Paramètres email mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  const updateAlertType = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailAlertType> & { id: string }) => {
      const { error } = await supabase
        .from('email_alert_types')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-alert-types'] });
      toast.success('Type d\'alerte mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  const updateAlertRecipients = useMutation({
    mutationFn: async ({ alertTypeId, roleIds }: { alertTypeId: string; roleIds: string[] }) => {
      // Delete existing recipients
      await supabase
        .from('email_alert_recipients')
        .delete()
        .eq('alert_type_id', alertTypeId);

      // Insert new recipients
      if (roleIds.length > 0) {
        const { error } = await supabase
          .from('email_alert_recipients')
          .insert(roleIds.map((roleId) => ({ alert_type_id: alertTypeId, role_id: roleId })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-alert-types'] });
      toast.success('Destinataires mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  return { updateSettings, updateAlertType, updateAlertRecipients };
};

// Helper function to send an alert email
export const sendAlertEmail = async (params: {
  alertType: string;
  module: string;
  entityName: string;
  entityId?: string;
  expectedValue?: string;
  actualValue?: string;
  userName?: string;
  directLink?: string;
  severity: 'critical' | 'major' | 'warning';
}) => {
  try {
    const { error } = await supabase.functions.invoke('send-alert-email', {
      body: params,
    });

    if (error) {
      // Email sending failed silently - logged server-side
    }
  } catch {
    // Failed to invoke function - logged server-side
  }
};
