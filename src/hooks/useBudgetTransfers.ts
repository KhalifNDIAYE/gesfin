import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BudgetTransfer {
  id: string;
  code: string;
  source_budget_line_id: string;
  destination_budget_line_id: string;
  amount: number;
  amount_local: number | null;
  reason: string;
  description: string | null;
  status: 'pending_director' | 'pending_admin' | 'approved' | 'rejected' | 'cancelled';
  director_validated_by: string | null;
  director_validated_at: string | null;
  director_comment: string | null;
  admin_validated_by: string | null;
  admin_validated_at: string | null;
  admin_comment: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  requested_by: string | null;
  created_at: string;
  updated_at: string;
  executed_at: string | null;
  // Joined data
  source_budget_line?: {
    id: string;
    description: string;
    budget: {
      id: string;
      name: string;
      code: string;
    };
  };
  destination_budget_line?: {
    id: string;
    description: string;
    budget: {
      id: string;
      name: string;
      code: string;
    };
  };
  requester?: {
    id: string;
    full_name: string;
    email: string;
  };
  director_validator?: {
    id: string;
    full_name: string;
  };
  admin_validator?: {
    id: string;
    full_name: string;
  };
}

export interface BudgetTransferHistory {
  id: string;
  transfer_id: string;
  action: string;
  from_status: string;
  to_status: string;
  comment: string | null;
  performed_by: string | null;
  performed_at: string;
  snapshot: Record<string, unknown> | null;
  performer?: {
    id: string;
    full_name: string;
  };
}

export interface CreateTransferParams {
  source_budget_line_id: string;
  destination_budget_line_id: string;
  amount: number;
  reason: string;
  description?: string;
}

export const useBudgetTransfers = () => {
  const queryClient = useQueryClient();

  const transfersQuery = useQuery({
    queryKey: ['budget-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transfers')
        .select(`
          *,
          source_budget_line:budget_lines!budget_transfers_source_budget_line_id_fkey(
            id,
            description,
            budget:budgets(id, name, code)
          ),
          destination_budget_line:budget_lines!budget_transfers_destination_budget_line_id_fkey(
            id,
            description,
            budget:budgets(id, name, code)
          ),
          requester:profiles!budget_transfers_requested_by_fkey(id, full_name, email),
          director_validator:profiles!budget_transfers_director_validated_by_fkey(id, full_name),
          admin_validator:profiles!budget_transfers_admin_validated_by_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as BudgetTransfer[];
    },
  });

  const historyQuery = (transferId: string) => useQuery({
    queryKey: ['budget-transfer-history', transferId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transfer_history')
        .select(`
          *,
          performer:profiles!budget_transfer_history_performed_by_fkey(id, full_name)
        `)
        .eq('transfer_id', transferId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data as unknown as BudgetTransferHistory[];
    },
    enabled: !!transferId,
  });

  const createTransfer = useMutation({
    mutationFn: async (params: CreateTransferParams) => {
      const { data, error } = await supabase.rpc('create_budget_transfer', {
        _source_budget_line_id: params.source_budget_line_id,
        _destination_budget_line_id: params.destination_budget_line_id,
        _amount: params.amount,
        _reason: params.reason,
        _description: params.description || null,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; transfer_id?: string; code?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création du transfert');
      }
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] });
      toast.success(`Transfert ${result.code} créé avec succès`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const validateDirector = useMutation({
    mutationFn: async ({ transferId, decision, comment }: { transferId: string; decision: 'approved' | 'rejected'; comment?: string }) => {
      const { data, error } = await supabase.rpc('validate_budget_transfer_director', {
        _transfer_id: transferId,
        _decision: decision,
        _comment: comment || null,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_status?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la validation');
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transfer-history'] });
      toast.success(variables.decision === 'approved' ? 'Transfert approuvé par le Directeur' : 'Transfert rejeté');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const validateAdmin = useMutation({
    mutationFn: async ({ transferId, decision, comment }: { transferId: string; decision: 'approved' | 'rejected'; comment?: string }) => {
      const { data, error } = await supabase.rpc('validate_budget_transfer_admin', {
        _transfer_id: transferId,
        _decision: decision,
        _comment: comment || null,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_status?: string; executed?: boolean };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la validation');
      }
      
      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transfer-history'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      if (result.executed) {
        toast.success('Transfert exécuté avec succès');
      } else {
        toast.success('Transfert rejeté');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    transfers: transfersQuery.data || [],
    isLoading: transfersQuery.isLoading,
    error: transfersQuery.error,
    refetch: transfersQuery.refetch,
    getHistory: historyQuery,
    createTransfer,
    validateDirector,
    validateAdmin,
  };
};
