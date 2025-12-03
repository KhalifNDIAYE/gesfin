import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type BudgetWorkflowStatus = 
  | 'draft'
  | 'soumis'
  | 'valide'
  | 'rejete'
  | 'clos';

export const BUDGET_STATUS_LABELS: Record<BudgetWorkflowStatus, string> = {
  draft: 'Brouillon',
  soumis: 'Soumis',
  valide: 'Validé',
  rejete: 'Rejeté',
  clos: 'Clos',
};

export const BUDGET_STATUS_COLORS: Record<BudgetWorkflowStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  soumis: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  valide: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  clos: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export interface BudgetValidationHistoryEntry {
  id: string;
  budget_id: string;
  from_status: BudgetWorkflowStatus;
  to_status: BudgetWorkflowStatus;
  action: string;
  comment: string | null;
  performed_by: string | null;
  performed_at: string;
  performer?: { full_name: string; email: string };
}

export const useUserBudgetRole = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-budget-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          role:roles(name, description)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const roles = data?.map(ur => (ur.role as any)?.name).filter(Boolean) || [];
      
      return {
        isAdmin: roles.includes('admin'),
        isDaf: roles.includes('daf'),
        isDg: roles.includes('dg'),
        roles,
      };
    },
    enabled: !!user?.id,
  });
};

export const useCanPerformBudgetAction = (
  currentStatus: BudgetWorkflowStatus | undefined
) => {
  const { data: userRole } = useUserBudgetRole();
  
  if (!currentStatus || !userRole) {
    return { canEdit: false, canSubmit: false, canValidate: false, canReject: false, canClose: false, canResubmit: false, canDelete: false };
  }
  
  const { isAdmin, isDaf, isDg } = userRole;
  
  return {
    canEdit: currentStatus === 'draft' && (isDaf || isAdmin),
    canSubmit: currentStatus === 'draft' && (isDaf || isAdmin),
    canValidate: currentStatus === 'soumis' && (isDg || isAdmin),
    canReject: currentStatus === 'soumis' && (isDg || isAdmin),
    canClose: currentStatus === 'valide' && (isDaf || isDg || isAdmin),
    canResubmit: currentStatus === 'rejete' && (isDaf || isAdmin),
    canDelete: currentStatus === 'draft' && (isDaf || isAdmin), // Can't delete validated budgets
  };
};

export const useBudgetWorkflowTransition = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      budgetId,
      newStatus,
      comment,
    }: {
      budgetId: string;
      newStatus: BudgetWorkflowStatus;
      comment?: string;
    }) => {
      const { data, error } = await supabase.rpc('validate_budget_transition', {
        _budget_id: budgetId,
        _new_status: newStatus,
        _user_id: user?.id,
        _comment: comment || null,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_status?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Transition non autorisée');
      }
      
      // Create notification based on new status
      await createBudgetWorkflowNotification(budgetId, newStatus, user?.id);
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budget-validation-history'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      const statusLabel = BUDGET_STATUS_LABELS[variables.newStatus];
      toast({ title: `Budget ${statusLabel.toLowerCase()}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
};

export const useBudgetValidationHistory = (budgetId: string | null) => {
  return useQuery({
    queryKey: ['budget-validation-history', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      
      const { data, error } = await supabase
        .from('budget_validation_history')
        .select(`
          *,
          performer:profiles!budget_validation_history_performed_by_fkey(full_name, email)
        `)
        .eq('budget_id', budgetId)
        .order('performed_at', { ascending: false });
      
      if (error) throw error;
      return data as BudgetValidationHistoryEntry[];
    },
    enabled: !!budgetId,
  });
};

async function createBudgetWorkflowNotification(
  budgetId: string,
  newStatus: BudgetWorkflowStatus,
  triggeredBy?: string
) {
  // Get budget details
  const { data: budget } = await supabase
    .from('budgets')
    .select('code, name, created_by')
    .eq('id', budgetId)
    .single();
  
  if (!budget) return;
  
  const notificationConfig: Record<BudgetWorkflowStatus, { targetRole?: string; targetUser?: string; title: string; message: string }> = {
    soumis: {
      targetRole: 'dg',
      title: 'Nouveau budget à valider',
      message: `Le budget ${budget.code} - ${budget.name} a été soumis pour validation`,
    },
    valide: {
      targetRole: 'daf',
      title: 'Budget validé',
      message: `Le budget ${budget.code} - ${budget.name} a été validé par la direction`,
    },
    rejete: {
      targetRole: 'daf',
      title: 'Budget rejeté',
      message: `Le budget ${budget.code} - ${budget.name} a été rejeté`,
    },
    clos: {
      targetRole: 'daf',
      title: 'Budget clôturé',
      message: `Le budget ${budget.code} - ${budget.name} a été clôturé`,
    },
    draft: {
      title: '',
      message: '',
    },
  };
  
  const config = notificationConfig[newStatus];
  if (!config.title) return;
  
  if (config.targetRole) {
    // Get users with the target role
    const { data: roleUsers } = await supabase
      .from('user_roles')
      .select('user_id, role:roles!inner(name)')
      .eq('roles.name', config.targetRole);
    
    if (roleUsers) {
      for (const ru of roleUsers) {
        await supabase.from('notifications').insert({
          user_id: ru.user_id,
          type: 'validation',
          severity: newStatus === 'rejete' ? 'error' : 'warning',
          module: 'comptabilite',
          title: config.title,
          message: config.message,
          related_entity_type: 'budget',
          related_entity_id: budgetId,
          related_entity_name: budget.code,
          direct_link: `/budget/${budgetId}`,
          triggered_by: triggeredBy,
        });
      }
    }
  }
}
