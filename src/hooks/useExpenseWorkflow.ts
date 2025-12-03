import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type ExpenseWorkflowStatus = 
  | 'brouillon'
  | 'soumise'
  | 'en_validation_daf'
  | 'en_validation_dt'
  | 'en_validation_dg'
  | 'validee'
  | 'rejetee'
  | 'payee';

export const EXPENSE_STATUS_LABELS: Record<ExpenseWorkflowStatus, string> = {
  brouillon: 'Brouillon',
  soumise: 'Soumise',
  en_validation_daf: 'En validation DAF',
  en_validation_dt: 'En validation DT',
  en_validation_dg: 'En validation DG',
  validee: 'Validée',
  rejetee: 'Rejetée',
  payee: 'Payée',
};

export const EXPENSE_STATUS_COLORS: Record<ExpenseWorkflowStatus, string> = {
  brouillon: 'bg-muted text-muted-foreground',
  soumise: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  en_validation_daf: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  en_validation_dt: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  en_validation_dg: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  validee: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejetee: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  payee: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
};

export interface ValidationHistoryEntry {
  id: string;
  journal_entry_id: string;
  from_status: ExpenseWorkflowStatus;
  to_status: ExpenseWorkflowStatus;
  action: string;
  comment: string | null;
  performed_by: string | null;
  performed_at: string;
  performer?: { full_name: string; email: string };
}

export const useUserWorkflowRole = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-workflow-role', user?.id],
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
        isDt: roles.includes('dt'),
        isDg: roles.includes('dg'),
        roles,
      };
    },
    enabled: !!user?.id,
  });
};

export const useCanPerformWorkflowAction = (
  currentStatus: ExpenseWorkflowStatus | undefined,
  entryCreatorId: string | undefined
) => {
  const { user } = useAuth();
  const { data: userRole } = useUserWorkflowRole();
  
  if (!currentStatus || !userRole) {
    return { canSubmit: false, canValidate: false, canReject: false, canPay: false, canEdit: false, canResubmit: false };
  }
  
  const isCreator = user?.id === entryCreatorId;
  const { isAdmin, isDaf, isDt, isDg } = userRole;
  
  return {
    canEdit: currentStatus === 'brouillon' && (isCreator || isAdmin),
    canSubmit: currentStatus === 'brouillon' && (isCreator || isAdmin),
    canValidate: 
      (currentStatus === 'soumise' && (isDaf || isAdmin)) ||
      (currentStatus === 'en_validation_daf' && (isDaf || isAdmin)) ||
      (currentStatus === 'en_validation_dt' && (isDt || isAdmin)) ||
      (currentStatus === 'en_validation_dg' && (isDg || isAdmin)),
    canReject:
      (currentStatus === 'soumise' && (isDaf || isAdmin)) ||
      (currentStatus === 'en_validation_daf' && (isDaf || isAdmin)) ||
      (currentStatus === 'en_validation_dt' && (isDt || isAdmin)) ||
      (currentStatus === 'en_validation_dg' && (isDg || isAdmin)),
    canPay: currentStatus === 'validee' && (isDaf || isAdmin),
    canResubmit: currentStatus === 'rejetee' && (isCreator || isAdmin),
  };
};

export const useCheckBudgetAvailability = () => {
  return useMutation({
    mutationFn: async ({ budgetLineId, amount }: { budgetLineId: string; amount: number }) => {
      const { data, error } = await supabase.rpc('check_budget_availability', {
        _budget_line_id: budgetLineId,
        _amount: amount,
      });
      
      if (error) throw error;
      return data as boolean;
    },
  });
};

export const useExpenseWorkflowTransition = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      entryId,
      newStatus,
      comment,
    }: {
      entryId: string;
      newStatus: ExpenseWorkflowStatus;
      comment?: string;
    }) => {
      const { data, error } = await supabase.rpc('validate_expense_transition', {
        _entry_id: entryId,
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
      await createWorkflowNotification(entryId, newStatus, user?.id);
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry'] });
      queryClient.invalidateQueries({ queryKey: ['expense-validation-history'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      const statusLabel = EXPENSE_STATUS_LABELS[variables.newStatus];
      toast({ title: `Dépense ${statusLabel.toLowerCase()}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
};

export const useExpenseValidationHistory = (entryId: string | null) => {
  return useQuery({
    queryKey: ['expense-validation-history', entryId],
    queryFn: async () => {
      if (!entryId) return [];
      
      const { data, error } = await supabase
        .from('expense_validation_history')
        .select(`
          *,
          performer:profiles!expense_validation_history_performed_by_fkey(full_name, email)
        `)
        .eq('journal_entry_id', entryId)
        .order('performed_at', { ascending: false });
      
      if (error) throw error;
      return data as ValidationHistoryEntry[];
    },
    enabled: !!entryId,
  });
};

async function createWorkflowNotification(
  entryId: string,
  newStatus: ExpenseWorkflowStatus,
  triggeredBy?: string
) {
  // Get entry details
  const { data: entry } = await supabase
    .from('journal_entries')
    .select('entry_number, description, created_by')
    .eq('id', entryId)
    .single();
  
  if (!entry) return;
  
  const notificationConfig: Record<ExpenseWorkflowStatus, { targetRole?: string; targetUser?: string; title: string; message: string }> = {
    soumise: {
      targetRole: 'daf',
      title: 'Nouvelle dépense à valider',
      message: `La dépense ${entry.entry_number} a été soumise pour validation`,
    },
    en_validation_daf: {
      targetRole: 'daf',
      title: 'Dépense en attente de validation DAF',
      message: `La dépense ${entry.entry_number} nécessite votre validation`,
    },
    en_validation_dt: {
      targetRole: 'dt',
      title: 'Dépense en attente de validation DT',
      message: `La dépense ${entry.entry_number} a été validée par le DAF et nécessite votre validation`,
    },
    en_validation_dg: {
      targetRole: 'dg',
      title: 'Dépense en attente de validation DG',
      message: `La dépense ${entry.entry_number} a été validée par le DT et nécessite votre validation`,
    },
    validee: {
      targetUser: entry.created_by || undefined,
      title: 'Dépense validée',
      message: `Votre dépense ${entry.entry_number} a été validée`,
    },
    rejetee: {
      targetUser: entry.created_by || undefined,
      title: 'Dépense rejetée',
      message: `Votre dépense ${entry.entry_number} a été rejetée`,
    },
    payee: {
      targetUser: entry.created_by || undefined,
      title: 'Dépense payée',
      message: `Votre dépense ${entry.entry_number} a été payée`,
    },
    brouillon: {
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
          severity: 'warning',
          module: 'comptabilite',
          title: config.title,
          message: config.message,
          related_entity_type: 'expense',
          related_entity_id: entryId,
          related_entity_name: entry.entry_number,
          direct_link: `/comptabilite/depenses?entry=${entryId}`,
          triggered_by: triggeredBy,
        });
      }
    }
  } else if (config.targetUser) {
    await supabase.from('notifications').insert({
      user_id: config.targetUser,
      type: newStatus === 'rejetee' ? 'alert' : 'validation',
      severity: newStatus === 'rejetee' ? 'error' : 'success',
      module: 'comptabilite',
      title: config.title,
      message: config.message,
      related_entity_type: 'expense',
      related_entity_id: entryId,
      related_entity_name: entry.entry_number,
      direct_link: `/comptabilite/depenses?entry=${entryId}`,
      triggered_by: triggeredBy,
    });
  }
}

export const getNextValidationStatus = (currentStatus: ExpenseWorkflowStatus): ExpenseWorkflowStatus | null => {
  const transitions: Partial<Record<ExpenseWorkflowStatus, ExpenseWorkflowStatus>> = {
    soumise: 'en_validation_daf',
    en_validation_daf: 'en_validation_dt',
    en_validation_dt: 'en_validation_dg',
    en_validation_dg: 'validee',
  };
  return transitions[currentStatus] || null;
};
