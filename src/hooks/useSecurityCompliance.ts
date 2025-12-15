import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export type ComplianceStandard = 'SOC2' | 'HIPAA' | 'RGPD' | 'FedRAMP' | 'ISO27001';
export type ComplianceStatus = 'conforme' | 'non_conforme' | 'a_ameliorer' | 'en_cours';
export type IncidentSeverity = 'mineur' | 'majeur' | 'critique';
export type IncidentStatus = 'ouvert' | 'en_cours' | 'clos';
export type SecurityPolicyType = 'mot_de_passe' | 'acces' | 'sauvegarde' | 'conservation_donnees';

export interface ComplianceControl {
  id: string;
  code: string;
  name: string;
  description: string | null;
  standard: ComplianceStandard;
  status: ComplianceStatus;
  responsible_id: string | null;
  evidence_document_path: string | null;
  evidence_description: string | null;
  last_verification_date: string | null;
  next_verification_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RGPDRegistry {
  id: string;
  treatment_name: string;
  purpose: string;
  data_categories: string[];
  legal_basis: string;
  retention_period: string;
  data_controller_id: string | null;
  subprocessors: string[] | null;
  data_subjects: string | null;
  security_measures: string | null;
  cross_border_transfers: boolean;
  transfer_details: string | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityIncident {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  impact: string | null;
  affected_systems: string[] | null;
  affected_users_count: number;
  detection_date: string;
  resolution_date: string | null;
  root_cause: string | null;
  corrective_actions: string | null;
  preventive_actions: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  closed_by: string | null;
  closed_at: string | null;
  notifications_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityPolicy {
  id: string;
  code: string;
  policy_type: SecurityPolicyType;
  name: string;
  description: string | null;
  content: string;
  version: string;
  is_active: boolean;
  effective_date: string;
  expiry_date: string | null;
  requires_acknowledgment: boolean;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  source: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  email_sent: boolean;
  notification_sent: boolean;
  created_at: string;
}

export interface SecurityMetrics {
  id: string;
  metric_date: string;
  active_users_count: number;
  failed_login_attempts: number;
  blocked_actions_count: number;
  security_incidents_count: number;
  compliance_score: number;
  created_at: string;
}

// Hooks

export const useComplianceControls = (standard?: ComplianceStandard) => {
  return useQuery({
    queryKey: ['compliance-controls', standard],
    queryFn: async () => {
      let query = supabase
        .from('compliance_controls')
        .select('*')
        .order('code', { ascending: true });

      if (standard) {
        query = query.eq('standard', standard);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ComplianceControl[];
    },
  });
};

export const useComplianceControlMutations = () => {
  const queryClient = useQueryClient();

  const createControl = useMutation({
    mutationFn: async (control: Partial<ComplianceControl>) => {
      const { data, error } = await supabase
        .from('compliance_controls')
        .insert(control as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-controls'] });
      toast.success('Contrôle de conformité créé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateControl = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ComplianceControl> & { id: string }) => {
      const { data, error } = await supabase
        .from('compliance_controls')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-controls'] });
      toast.success('Contrôle mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteControl = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compliance_controls')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-controls'] });
      toast.success('Contrôle supprimé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createControl, updateControl, deleteControl };
};

export const useRGPDRegistry = () => {
  return useQuery({
    queryKey: ['rgpd-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rgpd_registry')
        .select('*')
        .order('treatment_name', { ascending: true });
      if (error) throw error;
      return data as RGPDRegistry[];
    },
  });
};

export const useRGPDRegistryMutations = () => {
  const queryClient = useQueryClient();

  const createEntry = useMutation({
    mutationFn: async (entry: Partial<RGPDRegistry>) => {
      const { data, error } = await supabase
        .from('rgpd_registry')
        .insert(entry as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgpd-registry'] });
      toast.success('Traitement RGPD créé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RGPDRegistry> & { id: string }) => {
      const { data, error } = await supabase
        .from('rgpd_registry')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgpd-registry'] });
      toast.success('Traitement mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rgpd_registry')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgpd-registry'] });
      toast.success('Traitement supprimé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createEntry, updateEntry, deleteEntry };
};

export const useSecurityIncidents = (status?: IncidentStatus) => {
  return useQuery({
    queryKey: ['security-incidents', status],
    queryFn: async () => {
      let query = supabase
        .from('security_incidents')
        .select('*')
        .order('detection_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityIncident[];
    },
  });
};

export const useSecurityIncidentMutations = () => {
  const queryClient = useQueryClient();

  const createIncident = useMutation({
    mutationFn: async (incident: Partial<SecurityIncident>) => {
      const { data, error } = await supabase
        .from('security_incidents')
        .insert(incident as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-incidents'] });
      toast.success('Incident déclaré');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateIncident = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SecurityIncident> & { id: string }) => {
      const { data, error } = await supabase
        .from('security_incidents')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-incidents'] });
      toast.success('Incident mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createIncident, updateIncident };
};

export const useSecurityPolicies = () => {
  return useQuery({
    queryKey: ['security-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_policies')
        .select('*')
        .order('policy_type', { ascending: true });
      if (error) throw error;
      return data as SecurityPolicy[];
    },
  });
};

export const useSecurityPolicyMutations = () => {
  const queryClient = useQueryClient();

  const createPolicy = useMutation({
    mutationFn: async (policy: Partial<SecurityPolicy>) => {
      const { data, error } = await supabase
        .from('security_policies')
        .insert(policy as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-policies'] });
      toast.success('Politique créée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updatePolicy = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SecurityPolicy> & { id: string }) => {
      const { data, error } = await supabase
        .from('security_policies')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-policies'] });
      toast.success('Politique mise à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createPolicy, updatePolicy };
};

export const useSecurityAlerts = (resolved?: boolean) => {
  return useQuery({
    queryKey: ['security-alerts', resolved],
    queryFn: async () => {
      let query = supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (resolved !== undefined) {
        query = query.eq('is_resolved', resolved);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityAlert[];
    },
  });
};

export const useSecurityDashboardStats = () => {
  return useQuery({
    queryKey: ['security-dashboard-stats'],
    queryFn: async () => {
      // Get active users (logged in last 30 days)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get blocked actions
      const { count: blockedActions } = await supabase
        .from('security_blocked_actions')
        .select('*', { count: 'exact', head: true });

      // Get open incidents
      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('id, severity, status')
        .neq('status', 'clos');

      // Get compliance controls stats
      const { data: controls } = await supabase
        .from('compliance_controls')
        .select('id, status');

      const conformeCount = controls?.filter(c => c.status === 'conforme').length || 0;
      const totalControls = controls?.length || 1;
      const complianceScore = Math.round((conformeCount / totalControls) * 100);

      // Get recent alerts
      const { data: alerts } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        activeUsers: activeUsers || 0,
        blockedActions: blockedActions || 0,
        openIncidents: incidents?.length || 0,
        criticalIncidents: incidents?.filter(i => i.severity === 'critique').length || 0,
        complianceScore,
        totalControls,
        conformeControls: conformeCount,
        recentAlerts: alerts || [],
      };
    },
  });
};

export const useLoginStats = (days: number = 7) => {
  return useQuery({
    queryKey: ['login-stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .in('action', ['login', 'login_failed', 'logout'])
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const statsByDate = new Map<string, { logins: number; failed: number }>();
      
      data?.forEach(log => {
        const date = new Date(log.created_at!).toLocaleDateString('fr-FR');
        if (!statsByDate.has(date)) {
          statsByDate.set(date, { logins: 0, failed: 0 });
        }
        const stats = statsByDate.get(date)!;
        if (log.action === 'login') {
          stats.logins++;
        } else if (log.action === 'login_failed') {
          stats.failed++;
        }
      });

      return Array.from(statsByDate.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      }));
    },
  });
};
