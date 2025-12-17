import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export type CorrelationType = 'temporal' | 'behavioral' | 'contextual' | 'data_sensitive';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AIDecisionType = 'alert_created' | 'risk_score_updated' | 'auto_response_triggered' | 'baseline_updated' | 'pattern_detected';

export interface AICorrelationPattern {
  id: string;
  code: string;
  name: string;
  description: string | null;
  correlation_type: CorrelationType;
  event_types: string[];
  time_window_minutes: number;
  min_events_threshold: number;
  risk_weight: number;
  detection_logic: Record<string, unknown>;
  is_ai_learned: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRiskScore {
  id: string;
  user_id: string;
  session_id: string | null;
  current_score: number;
  risk_level: RiskLevel;
  score_factors: Array<{ factor: string; count?: number; contribution: number }>;
  last_events: unknown[];
  anomalies_detected: number;
  auto_responses_triggered: number;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface AICorrelatedAlert {
  id: string;
  alert_code: string;
  title: string;
  description: string | null;
  correlation_type: CorrelationType;
  pattern_id: string | null;
  user_id: string | null;
  user_email: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  severity: string;
  correlated_event_ids: string[];
  correlated_events: unknown[];
  event_count: number;
  time_span_minutes: number | null;
  ai_reasoning: string | null;
  risk_factors: Array<{ factor: string; weight?: number; explanation?: string }>;
  detection_confidence: number;
  first_event_at: string | null;
  last_event_at: string | null;
  status: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  auto_responses_applied: string[];
  created_at: string;
  updated_at: string;
}

export interface AICorrelationEvent {
  id: string;
  correlated_alert_id: string;
  event_type: string;
  event_source: string;
  event_id: string | null;
  event_timestamp: string;
  event_data: Record<string, unknown>;
  user_id: string | null;
  ip_address: string | null;
  risk_contribution: number;
  sequence_order: number | null;
  created_at: string;
}

export interface AIDecisionAudit {
  id: string;
  decision_type: AIDecisionType;
  related_alert_id: string | null;
  related_user_id: string | null;
  input_data: Record<string, unknown>;
  ai_model: string;
  ai_response: Record<string, unknown>;
  confidence_score: number | null;
  processing_time_ms: number | null;
  decision_made: string;
  decision_reasoning: string | null;
  auto_response_type: string | null;
  auto_response_executed: boolean;
  auto_response_result: Record<string, unknown> | null;
  is_explainable: boolean;
  compliance_tags: string[];
  created_at: string;
}

export interface AIEngineSetting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  description: string | null;
  is_critical: boolean;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

// Hooks for patterns
export const useAICorrelationPatterns = () => {
  return useQuery({
    queryKey: ['ai-correlation-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_correlation_patterns')
        .select('*')
        .order('correlation_type', { ascending: true });
      
      if (error) throw error;
      return data as AICorrelationPattern[];
    }
  });
};

// Hooks for risk scores
export const useUserRiskScores = (filters?: { userId?: string; riskLevel?: RiskLevel }) => {
  return useQuery({
    queryKey: ['user-risk-scores', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_risk_scores')
        .select('*')
        .is('session_id', null)
        .order('current_score', { ascending: false });
      
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as UserRiskScore[];
    }
  });
};

// Hooks for correlated alerts
export const useAICorrelatedAlerts = (filters?: { 
  status?: string; 
  riskLevel?: RiskLevel; 
  correlationType?: CorrelationType;
  userId?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['ai-correlated-alerts', filters],
    queryFn: async () => {
      let query = supabase
        .from('ai_correlated_alerts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }
      if (filters?.correlationType) {
        query = query.eq('correlation_type', filters.correlationType);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AICorrelatedAlert[];
    }
  });
};

// Hook for single alert with events
export const useAICorrelatedAlertDetails = (alertId: string | null) => {
  return useQuery({
    queryKey: ['ai-correlated-alert-details', alertId],
    queryFn: async () => {
      if (!alertId) return null;
      
      const [alertResult, eventsResult] = await Promise.all([
        supabase
          .from('ai_correlated_alerts')
          .select('*')
          .eq('id', alertId)
          .single(),
        supabase
          .from('ai_correlation_events')
          .select('*')
          .eq('correlated_alert_id', alertId)
          .order('sequence_order', { ascending: true })
      ]);
      
      if (alertResult.error) throw alertResult.error;
      
      return {
        alert: alertResult.data as AICorrelatedAlert,
        events: (eventsResult.data || []) as AICorrelationEvent[]
      };
    },
    enabled: !!alertId
  });
};

// Hook for AI decisions audit
export const useAIDecisionsAudit = (filters?: {
  decisionType?: AIDecisionType;
  userId?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['ai-decisions-audit', filters],
    queryFn: async () => {
      let query = supabase
        .from('ai_decisions_audit')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.decisionType) {
        query = query.eq('decision_type', filters.decisionType);
      }
      if (filters?.userId) {
        query = query.eq('related_user_id', filters.userId);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AIDecisionAudit[];
    }
  });
};

// Hook for engine settings
export const useAIEngineSettings = () => {
  return useQuery({
    queryKey: ['ai-engine-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_engine_settings')
        .select('*')
        .order('setting_key');
      
      if (error) throw error;
      return data as AIEngineSetting[];
    }
  });
};

// Hook for dashboard stats
export const useAIEngineStats = () => {
  return useQuery({
    queryKey: ['ai-engine-stats'],
    queryFn: async () => {
      const [alertsResult, decisionsResult, riskScoresResult] = await Promise.all([
        supabase
          .from('ai_correlated_alerts')
          .select('id, risk_level, status, created_at'),
        supabase
          .from('ai_decisions_audit')
          .select('id, decision_type, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('user_risk_scores')
          .select('id, risk_level, current_score')
          .is('session_id', null)
      ]);
      
      const alerts = alertsResult.data || [];
      const decisions = decisionsResult.data || [];
      const riskScores = riskScoresResult.data || [];
      
      return {
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => a.status === 'new' || a.status === 'acknowledged').length,
        alertsByRisk: {
          critical: alerts.filter(a => a.risk_level === 'critical').length,
          high: alerts.filter(a => a.risk_level === 'high').length,
          medium: alerts.filter(a => a.risk_level === 'medium').length,
          low: alerts.filter(a => a.risk_level === 'low').length
        },
        decisionsLast24h: decisions.length,
        usersAtRisk: {
          critical: riskScores.filter(s => s.risk_level === 'critical').length,
          high: riskScores.filter(s => s.risk_level === 'high').length,
          medium: riskScores.filter(s => s.risk_level === 'medium').length
        },
        averageRiskScore: riskScores.length > 0 
          ? riskScores.reduce((acc, s) => acc + (s.current_score || 0), 0) / riskScores.length 
          : 0
      };
    }
  });
};

// Mutations
export const useAICorrelationMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const analyzeEvents = useMutation({
    mutationFn: async (params: { userId?: string; timeWindowHours?: number }) => {
      const { data, error } = await supabase.functions.invoke('ai-correlation-engine', {
        body: { action: 'analyze_events', ...params }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-correlated-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-engine-stats'] });
      toast({
        title: "Analyse terminée",
        description: `${data.correlations?.length || 0} corrélation(s) détectée(s)`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'analyse",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const detectAnomalies = useMutation({
    mutationFn: async (params: { userId?: string; timeWindowHours?: number }) => {
      const { data, error } = await supabase.functions.invoke('ai-correlation-engine', {
        body: { action: 'detect_anomalies', ...params }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-decisions-audit'] });
      toast({
        title: "Détection terminée",
        description: `${data.anomalies?.length || 0} anomalie(s) détectée(s)`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de détection",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const calculateRisk = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-correlation-engine', {
        body: { action: 'calculate_risk', userId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-risk-scores'] });
      queryClient.invalidateQueries({ queryKey: ['ai-engine-stats'] });
      toast({
        title: "Score calculé",
        description: "Le score de risque a été mis à jour"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de calcul",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateBaseline = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-correlation-engine', {
        body: { action: 'update_baseline', userId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Baseline mis à jour",
        description: "Le profil comportemental a été recalculé"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de mise à jour",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateAlertStatus = useMutation({
    mutationFn: async ({ alertId, status, notes }: { alertId: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('ai_correlated_alerts')
        .update({ 
          status,
          resolution_notes: notes,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          acknowledged_at: status === 'acknowledged' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-correlated-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-engine-stats'] });
      toast({
        title: "Alerte mise à jour"
      });
    }
  });

  const updateEngineSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean | string | number | Record<string, unknown> }) => {
      const { error } = await supabase
        .from('ai_engine_settings')
        .update({ 
          setting_value: value as any,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-engine-settings'] });
      toast({
        title: "Paramètre mis à jour"
      });
    }
  });

  const togglePattern = useMutation({
    mutationFn: async ({ patternId, enabled }: { patternId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('ai_correlation_patterns')
        .update({ 
          is_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', patternId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-correlation-patterns'] });
      toast({
        title: "Pattern mis à jour"
      });
    }
  });

  return {
    analyzeEvents,
    detectAnomalies,
    calculateRisk,
    updateBaseline,
    updateAlertStatus,
    updateEngineSetting,
    togglePattern
  };
};
