import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ExceptionalOverride {
  id: string;
  journal_entry_id: string;
  budget_line_id: string | null;
  budget_id: string | null;
  project_id: string | null;
  requested_amount: number;
  budget_available: number;
  override_amount: number;
  override_percentage: number;
  override_reason: string;
  requested_by: string | null;
  requested_at: string;
  director_decision: 'pending' | 'approved' | 'rejected' | null;
  director_decided_by: string | null;
  director_decided_at: string | null;
  director_comment: string | null;
  admin_decision: 'pending' | 'approved' | 'rejected' | null;
  admin_decided_by: string | null;
  admin_decided_at: string | null;
  admin_comment: string | null;
  final_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // Joined data
  requester?: { full_name: string; email: string };
  director_approver?: { full_name: string; email: string };
  admin_approver?: { full_name: string; email: string };
  journal_entry?: { entry_number: string; description: string };
  budget?: { code: string; name: string };
  project?: { code: string; name: string };
}

export const useExceptionalOverrides = (status?: 'pending' | 'approved' | 'rejected') => {
  return useQuery({
    queryKey: ['exceptional-overrides', status],
    queryFn: async () => {
      let query = supabase
        .from('exceptional_overrides_log')
        .select(`
          *,
          requester:profiles!exceptional_overrides_log_requested_by_fkey(full_name, email),
          director_approver:profiles!exceptional_overrides_log_director_decided_by_fkey(full_name, email),
          admin_approver:profiles!exceptional_overrides_log_admin_decided_by_fkey(full_name, email),
          journal_entry:journal_entries!exceptional_overrides_log_journal_entry_id_fkey(entry_number, description),
          budget:budgets!exceptional_overrides_log_budget_id_fkey(code, name),
          project:projects!exceptional_overrides_log_project_id_fkey(code, name)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('final_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExceptionalOverride[];
    },
  });
};

export const usePendingOverridesForDirector = () => {
  return useQuery({
    queryKey: ['pending-overrides-director'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exceptional_overrides_log')
        .select(`
          *,
          requester:profiles!exceptional_overrides_log_requested_by_fkey(full_name, email),
          journal_entry:journal_entries!exceptional_overrides_log_journal_entry_id_fkey(entry_number, description),
          budget:budgets!exceptional_overrides_log_budget_id_fkey(code, name),
          project:projects!exceptional_overrides_log_project_id_fkey(code, name)
        `)
        .eq('director_decision', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExceptionalOverride[];
    },
  });
};

export const usePendingOverridesForAdmin = () => {
  return useQuery({
    queryKey: ['pending-overrides-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exceptional_overrides_log')
        .select(`
          *,
          requester:profiles!exceptional_overrides_log_requested_by_fkey(full_name, email),
          director_approver:profiles!exceptional_overrides_log_director_decided_by_fkey(full_name, email),
          journal_entry:journal_entries!exceptional_overrides_log_journal_entry_id_fkey(entry_number, description),
          budget:budgets!exceptional_overrides_log_budget_id_fkey(code, name),
          project:projects!exceptional_overrides_log_project_id_fkey(code, name)
        `)
        .eq('director_decision', 'approved')
        .eq('admin_decision', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExceptionalOverride[];
    },
  });
};

export const useRequestExceptionalOverride = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      entryId,
      budgetLineId,
      requestedAmount,
      overrideReason,
    }: {
      entryId: string;
      budgetLineId: string;
      requestedAmount: number;
      overrideReason: string;
    }) => {
      const { data, error } = await supabase.rpc('request_exceptional_override', {
        _entry_id: entryId,
        _budget_line_id: budgetLineId,
        _requested_amount: requestedAmount,
        _override_reason: overrideReason,
        _user_id: user?.id,
      });

      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string; override_amount?: number };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la demande');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptional-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['pending-overrides-director'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: 'Demande de dépassement envoyée', description: 'En attente de validation du Directeur' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDirectorOverrideDecision = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      overrideLogId,
      decision,
      comment,
    }: {
      overrideLogId: string;
      decision: 'approved' | 'rejected';
      comment?: string;
    }) => {
      const { data, error } = await supabase.rpc('process_director_override_decision', {
        _override_log_id: overrideLogId,
        _decision: decision,
        _comment: comment || null,
        _user_id: user?.id,
      });

      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du traitement');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exceptional-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['pending-overrides-director'] });
      queryClient.invalidateQueries({ queryKey: ['pending-overrides-admin'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ 
        title: variables.decision === 'approved' ? 'Dépassement approuvé' : 'Dépassement rejeté',
        description: variables.decision === 'approved' 
          ? 'En attente de validation Administrateur' 
          : 'La demande a été rejetée'
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
};

export const useAdminOverrideDecision = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      overrideLogId,
      decision,
      comment,
    }: {
      overrideLogId: string;
      decision: 'approved' | 'rejected';
      comment?: string;
    }) => {
      const { data, error } = await supabase.rpc('process_admin_override_decision', {
        _override_log_id: overrideLogId,
        _decision: decision,
        _comment: comment || null,
        _user_id: user?.id,
      });

      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du traitement');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exceptional-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['pending-overrides-admin'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ 
        title: variables.decision === 'approved' ? 'Dépassement validé' : 'Dépassement rejeté',
        description: variables.decision === 'approved' 
          ? 'Le dépassement a été définitivement approuvé' 
          : 'La demande a été définitivement rejetée'
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
};
