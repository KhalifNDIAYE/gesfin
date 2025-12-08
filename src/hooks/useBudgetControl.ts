import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { checkAndTriggerBudgetAlerts, isBudgetLineBlocked } from './useBudgetAlerts';

export interface BudgetControlResult {
  isAvailable: boolean;
  isBudgeted: boolean;
  isBlocked: boolean; // 100% consumption blocking
  remainingBudget: number;
  forecastAmount: number;
  committedAmount: number;
  realizedAmount: number;
  consumptionPercentage: number;
  requestedAmount: number;
  message: string | null;
  blockReason: 'insufficient' | 'not_budgeted' | 'missing_line' | 'missing_project' | 'missing_fiscal_year' | 'blocked_100' | null;
}

export { checkAndTriggerBudgetAlerts, isBudgetLineBlocked };

export interface BudgetLine {
  id: string;
  forecast_amount?: number | null;
  committed_amount?: number | null;
  realized_amount?: number | null;
  description?: string | null;
  line_number?: number;
}

export interface ExpenseValidationParams {
  budgetLineId: string | null | undefined;
  projectId: string | null | undefined;
  fiscalYearId: string | null | undefined;
  requestedAmount: number;
}

/**
 * Validate that expense has required links (project, budget line, fiscal year)
 */
export function validateExpenseLinks(params: ExpenseValidationParams): {
  isValid: boolean;
  message: string | null;
  blockReason: BudgetControlResult['blockReason'];
} {
  if (!params.projectId) {
    return {
      isValid: false,
      message: "Un projet est obligatoire pour créer une dépense",
      blockReason: 'missing_project',
    };
  }

  if (!params.budgetLineId) {
    return {
      isValid: false,
      message: "Une ligne budgétaire est obligatoire pour créer une dépense",
      blockReason: 'missing_line',
    };
  }

  if (!params.fiscalYearId) {
    return {
      isValid: false,
      message: "Un exercice fiscal est obligatoire pour créer une dépense",
      blockReason: 'missing_fiscal_year',
    };
  }

  return { isValid: true, message: null, blockReason: null };
}

/**
 * Check if a budget line is budgeted (has forecast amount > 0)
 */
export function isBudgetLineBudgeted(budgetLine: BudgetLine | undefined): boolean {
  if (!budgetLine) return false;
  return (budgetLine.forecast_amount ?? 0) > 0;
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
      isBudgeted: false,
      isBlocked: true,
      remainingBudget: 0,
      forecastAmount: 0,
      committedAmount: 0,
      realizedAmount: 0,
      consumptionPercentage: 0,
      requestedAmount,
      message: "Ligne budgétaire introuvable",
      blockReason: 'missing_line',
    };
  }

  const forecastAmount = budgetLine.forecast_amount || 0;
  const committedAmount = budgetLine.committed_amount || 0;
  const realizedAmount = budgetLine.realized_amount || 0;

  // Check if line is budgeted (has forecast > 0)
  const isBudgeted = forecastAmount > 0;
  
  if (!isBudgeted) {
    return {
      isAvailable: false,
      isBudgeted: false,
      isBlocked: true,
      remainingBudget: 0,
      forecastAmount,
      committedAmount,
      realizedAmount,
      consumptionPercentage: 0,
      requestedAmount,
      message: "Impossible de créer une dépense sur une ligne non budgétisée (budget prévisionnel = 0)",
      blockReason: 'not_budgeted',
    };
  }
  
  // Budget restant = Budget validé - (Engagé + Réalisé)
  const consumedAmount = committedAmount + realizedAmount;
  const consumptionPercentage = forecastAmount > 0 ? (consumedAmount / forecastAmount) * 100 : 0;
  const remainingBudget = forecastAmount - consumedAmount;
  const isBlocked = consumptionPercentage >= 100;
  const isAvailable = !isBlocked && remainingBudget >= requestedAmount;

  let message: string | null = null;
  let blockReason: BudgetControlResult['blockReason'] = null;

  if (isBlocked) {
    message = `Budget épuisé (${consumptionPercentage.toFixed(1)}% consommé). Blocage total activé.`;
    blockReason = 'blocked_100';
  } else if (!isAvailable) {
    message = `Budget insuffisant pour cette ligne. Disponible: ${remainingBudget.toLocaleString()} XOF, Demandé: ${requestedAmount.toLocaleString()} XOF`;
    blockReason = 'insufficient';
  }

  return {
    isAvailable,
    isBudgeted: true,
    isBlocked,
    remainingBudget,
    forecastAmount,
    committedAmount,
    realizedAmount,
    consumptionPercentage,
    requestedAmount,
    message,
    blockReason,
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
  action: 'creation' | 'soumission',
  blockReason: BudgetControlResult['blockReason']
): Promise<void> {
  if (!userId) return;

  try {
    const reasonMessages: Record<NonNullable<BudgetControlResult['blockReason']>, string> = {
      insufficient: 'Budget insuffisant pour cette ligne',
      not_budgeted: 'Ligne non budgétisée (budget prévisionnel = 0)',
      missing_line: 'Ligne budgétaire manquante',
      missing_project: 'Projet manquant',
      missing_fiscal_year: 'Exercice fiscal manquant',
      blocked_100: 'Budget épuisé (100% consommé) - Blocage total',
    };

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
        blocked_reason: blockReason ? reasonMessages[blockReason] : 'Raison inconnue',
        action_blocked: action,
        block_type: blockReason,
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
  params: ExpenseValidationParams,
  budgetLines: BudgetLine[] | undefined,
  userId: string | undefined,
  action: 'creation' | 'soumission'
): Promise<{ canProceed: boolean; result: BudgetControlResult }> {
  // First, validate required links
  const linksValidation = validateExpenseLinks(params);
  
  if (!linksValidation.isValid) {
    const result: BudgetControlResult = {
      isAvailable: false,
      isBudgeted: false,
      isBlocked: true,
      remainingBudget: 0,
      forecastAmount: 0,
      committedAmount: 0,
      realizedAmount: 0,
      consumptionPercentage: 0,
      requestedAmount: params.requestedAmount,
      message: linksValidation.message,
      blockReason: linksValidation.blockReason,
    };

    toast({
      title: "Données obligatoires manquantes",
      description: linksValidation.message || "Veuillez compléter tous les champs obligatoires",
      variant: "destructive",
    });

    return { canProceed: false, result };
  }

  // Then check budget availability
  const result = await checkBudgetControl(params.budgetLineId!, params.requestedAmount, budgetLines);

  if (!result.isAvailable) {
    const budgetLine = budgetLines?.find(bl => bl.id === params.budgetLineId);
    
    // Log to audit
    await logBudgetControlBlock(
      userId,
      params.budgetLineId!,
      budgetLine?.description || null,
      params.requestedAmount,
      result.remainingBudget,
      action,
      result.blockReason
    );

    // Show toast with appropriate message
    const title = result.blockReason === 'not_budgeted' 
      ? "Ligne non budgétisée"
      : "Blocage budgétaire";
      
    toast({
      title,
      description: result.message || "Budget insuffisant pour cette ligne",
      variant: "destructive",
    });

    return { canProceed: false, result };
  }

  return { canProceed: true, result };
}
