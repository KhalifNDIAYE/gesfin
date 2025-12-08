import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDisbursementStats } from './useDecaissements';
import { useQuery } from '@tanstack/react-query';

export interface DisbursementControlResult {
  canProceed: boolean;
  expenseValidated: boolean;
  budgetAvailable: boolean;
  treasuryAvailable: boolean;
  blockReasons: string[];
  details: {
    expenseStatus?: string;
    expenseAmount?: number;
    availableBudget?: number;
    availableTreasury?: number;
    requestedAmount?: number;
  };
}

export interface DisbursementControlParams {
  disbursementId: string;
  amount: number;
  relatedExpenseId?: string | null;
  conventionId?: string | null;
}

/**
 * Vérifie si la dépense liée est validée
 */
export async function checkExpenseValidated(relatedExpenseId: string | null | undefined): Promise<{
  isValidated: boolean;
  status?: string;
  amount?: number;
  message?: string;
}> {
  if (!relatedExpenseId) {
    return {
      isValidated: false,
      message: "Aucune dépense liée à ce décaissement. Une dépense validée est requise.",
    };
  }

  const { data: expense, error } = await supabase
    .from('journal_entries')
    .select('id, status, expense_workflow_status, requested_amount')
    .eq('id', relatedExpenseId)
    .single();

  if (error || !expense) {
    return {
      isValidated: false,
      message: "Dépense liée introuvable dans le système.",
    };
  }

  // Les statuts valides pour un paiement : workflow_status "paye" ou status "validated"
  const workflowStatus = expense.expense_workflow_status?.toLowerCase() || '';
  const entryStatus = (expense.status as string)?.toLowerCase() || '';
  
  const validWorkflowStatuses = ['paye', 'valide', 'validated'];
  const validEntryStatuses = ['validated', 'posted'];
  
  const isValidated = validWorkflowStatuses.includes(workflowStatus) || validEntryStatuses.includes(entryStatus);

  if (!isValidated) {
    const displayStatus = expense.expense_workflow_status || expense.status || 'brouillon';
    return {
      isValidated: false,
      status: displayStatus as string,
      amount: Number(expense.requested_amount || 0),
      message: `La dépense n'est pas encore validée (statut actuel: ${displayStatus}). Elle doit être validée avant le paiement.`,
    };
  }

  return {
    isValidated: true,
    status: (expense.expense_workflow_status || expense.status) as string,
    amount: Number(expense.requested_amount || 0),
  };
}

/**
 * Vérifie la disponibilité budgétaire via la convention
 */
export async function checkBudgetAvailableForDisbursement(
  conventionId: string | null | undefined,
  amount: number
): Promise<{
  isAvailable: boolean;
  availableBudget?: number;
  message?: string;
}> {
  if (!conventionId) {
    // Si pas de convention, on vérifie via le budget global
    const { data: stats } = await supabase
      .from('budgets')
      .select('total_amount, status')
      .eq('status', 'approved')
      .limit(1);
    
    // Considérer disponible si on n'a pas de convention liée
    return { isAvailable: true, availableBudget: 0 };
  }

  const { data: convention, error } = await supabase
    .from('conventions')
    .select('id, remaining_amount, total_amount, disbursed_amount')
    .eq('id', conventionId)
    .single();

  if (error || !convention) {
    return {
      isAvailable: false,
      message: "Convention introuvable. Impossible de vérifier le budget.",
    };
  }

  const remaining = Number(convention.remaining_amount || 0);
  const isAvailable = remaining >= amount;

  if (!isAvailable) {
    return {
      isAvailable: false,
      availableBudget: remaining,
      message: `Budget insuffisant sur la convention. Disponible: ${remaining.toLocaleString()} XOF, Demandé: ${amount.toLocaleString()} XOF`,
    };
  }

  return {
    isAvailable: true,
    availableBudget: remaining,
  };
}

/**
 * Vérifie la disponibilité de trésorerie
 */
export async function checkTreasuryAvailable(amount: number): Promise<{
  isAvailable: boolean;
  availableTreasury?: number;
  message?: string;
}> {
  // Calculer la trésorerie disponible (encaissements - décaissements)
  const { data: replenishments } = await supabase
    .from('replenishments')
    .select('amount, status')
    .eq('status', 'received');

  const totalEncaissements = replenishments?.reduce(
    (sum, r) => sum + Number(r.amount || 0), 0
  ) || 0;

  const { data: directPayments } = await supabase
    .from('direct_payments')
    .select('amount, status')
    .eq('status', 'paid');

  const totalDecaissements = directPayments?.reduce(
    (sum, p) => sum + Number(p.amount || 0), 0
  ) || 0;

  const { data: contractPayments } = await supabase
    .from('contract_payments')
    .select('amount, status')
    .eq('status', 'processed');

  const contractDecaissements = contractPayments?.reduce(
    (sum, p) => sum + Number(p.amount || 0), 0
  ) || 0;

  const availableTreasury = totalEncaissements - totalDecaissements - contractDecaissements;
  const isAvailable = availableTreasury >= amount;

  if (!isAvailable) {
    return {
      isAvailable: false,
      availableTreasury,
      message: `Trésorerie insuffisante. Disponible: ${availableTreasury.toLocaleString()} XOF, Demandé: ${amount.toLocaleString()} XOF`,
    };
  }

  return {
    isAvailable: true,
    availableTreasury,
  };
}

/**
 * Validation complète avant paiement du décaissement
 */
export async function validateDisbursementBeforePayment(
  params: DisbursementControlParams
): Promise<DisbursementControlResult> {
  const blockReasons: string[] = [];
  const details: DisbursementControlResult['details'] = {
    requestedAmount: params.amount,
  };

  // 1. Vérifier que la dépense est validée
  const expenseCheck = await checkExpenseValidated(params.relatedExpenseId);
  details.expenseStatus = expenseCheck.status;
  details.expenseAmount = expenseCheck.amount;
  
  if (!expenseCheck.isValidated && expenseCheck.message) {
    blockReasons.push(expenseCheck.message);
  }

  // 2. Vérifier la disponibilité budgétaire
  const budgetCheck = await checkBudgetAvailableForDisbursement(
    params.conventionId,
    params.amount
  );
  details.availableBudget = budgetCheck.availableBudget;
  
  if (!budgetCheck.isAvailable && budgetCheck.message) {
    blockReasons.push(budgetCheck.message);
  }

  // 3. Vérifier la disponibilité de trésorerie
  const treasuryCheck = await checkTreasuryAvailable(params.amount);
  details.availableTreasury = treasuryCheck.availableTreasury;
  
  if (!treasuryCheck.isAvailable && treasuryCheck.message) {
    blockReasons.push(treasuryCheck.message);
  }

  const canProceed = blockReasons.length === 0;

  return {
    canProceed,
    expenseValidated: expenseCheck.isValidated,
    budgetAvailable: budgetCheck.isAvailable,
    treasuryAvailable: treasuryCheck.isAvailable,
    blockReasons,
    details,
  };
}

/**
 * Log le blocage du décaissement dans l'audit
 */
export async function logDisbursementBlock(
  userId: string | undefined,
  disbursementId: string,
  disbursementCode: string,
  amount: number,
  blockReasons: string[]
): Promise<void> {
  if (!userId) return;

  try {
    await supabase.rpc('log_audit_event', {
      _action: 'blocage_decaissement_paiement',
      _module: 'decaissements',
      _resource_type: 'disbursement',
      _resource_id: disbursementId,
      _old_values: JSON.stringify({
        disbursement_id: disbursementId,
        disbursement_code: disbursementCode,
        requested_amount: amount,
      }),
      _new_values: JSON.stringify({
        blocked: true,
        block_reasons: blockReasons,
        block_count: blockReasons.length,
      }),
    });
  } catch (error) {
    console.error('Failed to log disbursement block:', error);
  }
}

/**
 * Hook pour récupérer les informations de contrôle d'un décaissement
 */
export function useDisbursementControlCheck(disbursementId: string | null) {
  return useQuery({
    queryKey: ['disbursement-control-check', disbursementId],
    queryFn: async () => {
      if (!disbursementId) return null;

      const { data: disbursement, error } = await supabase
        .from('direct_payments')
        .select('id, code, amount, related_expense_id, convention_id, workflow_status')
        .eq('id', disbursementId)
        .single();

      if (error || !disbursement) return null;

      const control = await validateDisbursementBeforePayment({
        disbursementId,
        amount: Number(disbursement.amount || 0),
        relatedExpenseId: disbursement.related_expense_id,
        conventionId: disbursement.convention_id,
      });

      return {
        disbursement,
        control,
      };
    },
    enabled: !!disbursementId,
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Afficher un toast avec les raisons de blocage
 */
export function showDisbursementBlockToast(blockReasons: string[]) {
  const reasonsList = blockReasons.map((reason, index) => `${index + 1}. ${reason}`).join('\n');
  
  toast({
    title: "Blocage du décaissement",
    description: `Conditions non remplies pour le paiement :\n${reasonsList}`,
    variant: "destructive",
  });
}
