import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  validateDisbursementBeforePayment, 
  logDisbursementBlock, 
  showDisbursementBlockToast 
} from './useDisbursementControl';

export type DisbursementWorkflowStatus = 
  | 'brouillon'
  | 'soumis'
  | 'en_validation_daf'
  | 'en_validation_dg'
  | 'valide'
  | 'rejete'
  | 'paye';

export const DISBURSEMENT_STATUS_LABELS: Record<DisbursementWorkflowStatus, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  en_validation_daf: 'En validation DAF',
  en_validation_dg: 'En validation DG',
  valide: 'Validé',
  rejete: 'Rejeté',
  paye: 'Payé',
};

export const DISBURSEMENT_STATUS_COLORS: Record<DisbursementWorkflowStatus, string> = {
  brouillon: 'bg-muted text-muted-foreground',
  soumis: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  en_validation_daf: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  en_validation_dg: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  valide: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  paye: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
};

export interface DisbursementValidationHistoryEntry {
  id: string;
  disbursement_id: string;
  from_status: DisbursementWorkflowStatus;
  to_status: DisbursementWorkflowStatus;
  action: string;
  comment: string | null;
  performed_by: string | null;
  performed_at: string;
  performer?: { full_name: string; email: string };
}

export const useUserDisbursementRole = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-disbursement-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select(`role:roles(name, description)`)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const roles = data?.map(ur => (ur.role as any)?.name).filter(Boolean) || [];
      
      return {
        isAdmin: roles.includes('admin'),
        isComptable: roles.includes('comptable'),
        isDaf: roles.includes('daf'),
        isDg: roles.includes('dg'),
        roles,
      };
    },
    enabled: !!user?.id,
  });
};

export const useCanPerformDisbursementAction = (
  currentStatus: DisbursementWorkflowStatus | undefined
) => {
  const { data: userRole } = useUserDisbursementRole();
  
  if (!currentStatus || !userRole) {
    return { canEdit: false, canSubmit: false, canValidateDaf: false, canValidateDg: false, canReject: false, canPay: false, canResubmit: false };
  }
  
  const { isAdmin, isComptable, isDaf, isDg } = userRole;
  
  return {
    canEdit: currentStatus === 'brouillon' && (isComptable || isDaf || isAdmin),
    canSubmit: currentStatus === 'brouillon' && (isComptable || isDaf || isAdmin),
    canValidateDaf: (currentStatus === 'soumis' || currentStatus === 'en_validation_daf') && (isDaf || isAdmin),
    canValidateDg: currentStatus === 'en_validation_dg' && (isDg || isAdmin),
    canReject: 
      ((currentStatus === 'soumis' || currentStatus === 'en_validation_daf') && (isDaf || isAdmin)) ||
      (currentStatus === 'en_validation_dg' && (isDg || isAdmin)),
    canPay: currentStatus === 'valide' && (isComptable || isDaf || isAdmin),
    canResubmit: currentStatus === 'rejete' && (isComptable || isAdmin),
  };
};

export const useDisbursementWorkflowTransition = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      disbursementId,
      newStatus,
      comment,
    }: {
      disbursementId: string;
      newStatus: DisbursementWorkflowStatus;
      comment?: string;
    }) => {
      // Si on passe au statut "paye", vérifier les conditions préalables
      if (newStatus === 'paye') {
        // Récupérer les informations du décaissement
        const { data: disbursement, error: fetchError } = await supabase
          .from('direct_payments')
          .select('id, code, amount, related_expense_id, convention_id')
          .eq('id', disbursementId)
          .single();

        if (fetchError || !disbursement) {
          throw new Error('Décaissement introuvable');
        }

        // Valider les conditions avant paiement
        const controlResult = await validateDisbursementBeforePayment({
          disbursementId,
          amount: Number(disbursement.amount || 0),
          relatedExpenseId: disbursement.related_expense_id,
          conventionId: disbursement.convention_id,
        });

        if (!controlResult.canProceed) {
          // Logger le blocage dans l'audit
          await logDisbursementBlock(
            user?.id,
            disbursementId,
            disbursement.code,
            Number(disbursement.amount || 0),
            controlResult.blockReasons
          );

          // Afficher les raisons de blocage
          showDisbursementBlockToast(controlResult.blockReasons);

          throw new Error('Conditions de paiement non remplies');
        }
      }

      const { data, error } = await supabase.rpc('validate_disbursement_transition', {
        _disbursement_id: disbursementId,
        _new_status: newStatus,
        _user_id: user?.id,
        _comment: comment || null,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_status?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Transition non autorisée');
      }
      
      await createDisbursementWorkflowNotification(disbursementId, newStatus, user?.id);
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['direct-payments'] });
      queryClient.invalidateQueries({ queryKey: ['disbursement-validation-history'] });
      queryClient.invalidateQueries({ queryKey: ['recent-movements'] });
      queryClient.invalidateQueries({ queryKey: ['disbursement-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      const statusLabel = DISBURSEMENT_STATUS_LABELS[variables.newStatus];
      toast({ title: `Décaissement ${statusLabel.toLowerCase()}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDisbursementValidationHistory = (disbursementId: string | null) => {
  return useQuery({
    queryKey: ['disbursement-validation-history', disbursementId],
    queryFn: async () => {
      if (!disbursementId) return [];
      
      const { data, error } = await supabase
        .from('disbursement_validation_history')
        .select(`
          *,
          performer:profiles!disbursement_validation_history_performed_by_fkey(full_name, email)
        `)
        .eq('disbursement_id', disbursementId)
        .order('performed_at', { ascending: false });
      
      if (error) throw error;
      return data as DisbursementValidationHistoryEntry[];
    },
    enabled: !!disbursementId,
  });
};

async function createDisbursementWorkflowNotification(
  disbursementId: string,
  newStatus: DisbursementWorkflowStatus,
  triggeredBy?: string
) {
  const { data: disbursement } = await supabase
    .from('direct_payments')
    .select('code, beneficiary_name, created_by')
    .eq('id', disbursementId)
    .single();
  
  if (!disbursement) return;
  
  const notificationConfig: Record<DisbursementWorkflowStatus, { targetRole?: string; targetUser?: string; title: string; message: string }> = {
    soumis: {
      targetRole: 'daf',
      title: 'Nouveau décaissement à valider',
      message: `Le décaissement ${disbursement.code} pour ${disbursement.beneficiary_name} a été soumis`,
    },
    en_validation_daf: {
      targetRole: 'daf',
      title: 'Décaissement en attente de validation DAF',
      message: `Le décaissement ${disbursement.code} nécessite votre validation`,
    },
    en_validation_dg: {
      targetRole: 'dg',
      title: 'Décaissement en attente de validation DG',
      message: `Le décaissement ${disbursement.code} a été validé par le DAF et nécessite votre approbation`,
    },
    valide: {
      targetRole: 'comptable',
      title: 'Décaissement validé',
      message: `Le décaissement ${disbursement.code} a été validé et peut être payé`,
    },
    rejete: {
      targetRole: 'comptable',
      title: 'Décaissement rejeté',
      message: `Le décaissement ${disbursement.code} a été rejeté`,
    },
    paye: {
      targetUser: disbursement.created_by || undefined,
      title: 'Décaissement payé',
      message: `Le décaissement ${disbursement.code} a été effectué`,
    },
    brouillon: {
      title: '',
      message: '',
    },
  };
  
  const config = notificationConfig[newStatus];
  if (!config.title) return;
  
  if (config.targetRole) {
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
          module: 'decaissements',
          title: config.title,
          message: config.message,
          related_entity_type: 'disbursement',
          related_entity_id: disbursementId,
          related_entity_name: disbursement.code,
          direct_link: `/decaissements`,
          triggered_by: triggeredBy,
        });
      }
    }
  } else if (config.targetUser) {
    await supabase.from('notifications').insert({
      user_id: config.targetUser,
      type: newStatus === 'rejete' ? 'alert' : 'validation',
      severity: newStatus === 'rejete' ? 'error' : 'success',
      module: 'decaissements',
      title: config.title,
      message: config.message,
      related_entity_type: 'disbursement',
      related_entity_id: disbursementId,
      related_entity_name: disbursement.code,
      direct_link: `/decaissements`,
      triggered_by: triggeredBy,
    });
  }
}
