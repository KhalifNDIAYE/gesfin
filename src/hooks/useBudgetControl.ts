import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface BudgetControlResult {
  isAvailable: boolean;
  remainingBudget: number;
  forecastAmount: number;
  committedAmount: number;
  realizedAmount: number;
  requestedAmount: number;
  message: string | null;
}

export interface BudgetLine {
  id: string;
  forecast_amount?: number | null;
  committed_amount?: number | null;
  realized_amount?: number | null;
  description?: string | null;
  line_number?: number;
}

/**
 * Check if budget is available for a given expense amount
 */
export async function checkBudgetControl(
  budgetLineId: string,
  requestedAmount: number,
  budgetLines: BudgetLine[] | undefined
): Promise<BudgetControlResult> {
  const budgetLine = budgetLines?.find(bl => bl.id === budgetLineId);
  
  if (!budgetLine) {
    return {
      isAvailable: false,
      remainingBudget: 0,
      forecastAmount: 0,
      committedAmount: 0,
      realizedAmount: 0,
      requestedAmount,
      message: "Ligne budgétaire introuvable",
    };
  }

  const forecastAmount = budgetLine.forecast_amount || 0;
  const committedAmount = budgetLine.committed_amount || 0;
  const realizedAmount = budgetLine.realized_amount || 0;
  
  // Budget restant = Budget validé - (Engagé + Réalisé)
  const remainingBudget = forecastAmount - (committedAmount + realizedAmount);
  const isAvailable = remainingBudget >= requestedAmount;

  return {
    isAvailable,
    remainingBudget,
    forecastAmount,
    committedAmount,
    realizedAmount,
    requestedAmount,
    message: isAvailable 
      ? null 
      : `Budget insuffisant pour cette ligne. Disponible: ${remainingBudget.toLocaleString()} XOF, Demandé: ${requestedAmount.toLocaleString()} XOF`,
  };
}

/**
 * Log budget control blocked event to audit log
 */
export async function logBudgetControlBlock(
  userId: string | undefined,
  budgetLineId: string,
  budgetLineDescription: string | null,
  requestedAmount: number,
  remainingBudget: number,
  action: 'creation' | 'soumission'
): Promise<void> {
  if (!userId) return;

  try {
    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    await supabase.rpc('log_audit_event', {
      _action: `blocage_budget_${action}`,
      _module: 'comptabilite',
      _resource_type: 'expense',
      _resource_id: budgetLineId,
      _old_values: JSON.stringify({
        budget_line_id: budgetLineId,
        budget_line_description: budgetLineDescription,
        remaining_budget: remainingBudget,
      }),
      _new_values: JSON.stringify({
        requested_amount: requestedAmount,
        blocked_reason: 'Budget insuffisant pour cette ligne',
        action_blocked: action,
      }),
    });

    console.log('Budget control block logged to audit');
  } catch (error) {
    console.error('Failed to log budget control block:', error);
  }
}

/**
 * Validate expense before creation or submission
 * Returns true if expense can proceed, false if blocked
 */
export async function validateExpenseWithBudgetControl(
  budgetLineId: string,
  requestedAmount: number,
  budgetLines: BudgetLine[] | undefined,
  userId: string | undefined,
  action: 'creation' | 'soumission'
): Promise<{ canProceed: boolean; result: BudgetControlResult }> {
  const result = await checkBudgetControl(budgetLineId, requestedAmount, budgetLines);

  if (!result.isAvailable) {
    const budgetLine = budgetLines?.find(bl => bl.id === budgetLineId);
    
    // Log to audit
    await logBudgetControlBlock(
      userId,
      budgetLineId,
      budgetLine?.description || null,
      requestedAmount,
      result.remainingBudget,
      action
    );

    // Show toast
    toast({
      title: "Blocage budgétaire",
      description: result.message || "Budget insuffisant pour cette ligne",
      variant: "destructive",
    });

    return { canProceed: false, result };
  }

  return { canProceed: true, result };
}
