import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ContractBudgetControlResult {
  isAvailable: boolean;
  isBudgeted: boolean;
  isBlocked: boolean;
  availableBudget: number;
  forecastAmount: number;
  committedAmount: number;
  realizedAmount: number;
  consumptionPercentage: number;
  requestedAmount: number;
  message: string | null;
  blockReason: 'insufficient' | 'not_budgeted' | 'missing_line' | 'blocked_100' | null;
}

export interface BudgetLineInfo {
  id: string;
  description: string | null;
  forecast_amount: number | null;
  committed_amount: number | null;
  realized_amount: number | null;
  budget: {
    id: string;
    name: string;
    code: string;
    status: string;
  } | null;
}

// Hook to fetch available budget lines
export function useAvailableBudgetLines() {
  return useQuery({
    queryKey: ['budget_lines', 'for_contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lines')
        .select(`
          id,
          description,
          forecast_amount,
          committed_amount,
          realized_amount,
          budget:budgets (
            id,
            name,
            code,
            status
          )
        `)
        .order('line_number', { ascending: true });
      
      if (error) throw error;
      return data as BudgetLineInfo[];
    },
  });
}

// Validate contract engagement against budget
export function validateContractEngagement(
  budgetLineId: string | null | undefined,
  requestedAmount: number,
  budgetLines: BudgetLineInfo[] | undefined
): ContractBudgetControlResult {
  // If no budget line is selected, allow (optional link)
  if (!budgetLineId) {
    return {
      isAvailable: true,
      isBudgeted: false,
      isBlocked: false,
      availableBudget: 0,
      forecastAmount: 0,
      committedAmount: 0,
      realizedAmount: 0,
      consumptionPercentage: 0,
      requestedAmount,
      message: null,
      blockReason: null,
    };
  }

  const budgetLine = budgetLines?.find(bl => bl.id === budgetLineId);

  if (!budgetLine) {
    return {
      isAvailable: false,
      isBudgeted: false,
      isBlocked: true,
      availableBudget: 0,
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

  // Check if line is budgeted
  const isBudgeted = forecastAmount > 0;

  if (!isBudgeted) {
    return {
      isAvailable: false,
      isBudgeted: false,
      isBlocked: true,
      availableBudget: 0,
      forecastAmount,
      committedAmount,
      realizedAmount,
      consumptionPercentage: 0,
      requestedAmount,
      message: "Impossible d'engager un marché sur une ligne non budgétisée (budget prévisionnel = 0)",
      blockReason: 'not_budgeted',
    };
  }

  // Available budget = Forecast - (Committed + Realized)
  const consumedAmount = committedAmount + realizedAmount;
  const consumptionPercentage = forecastAmount > 0 ? (consumedAmount / forecastAmount) * 100 : 0;
  const availableBudget = forecastAmount - consumedAmount;
  const isBlocked = consumptionPercentage >= 100;
  const isAvailable = !isBlocked && availableBudget >= requestedAmount;

  let message: string | null = null;
  let blockReason: ContractBudgetControlResult['blockReason'] = null;

  if (isBlocked) {
    message = `Budget épuisé (${consumptionPercentage.toFixed(1)}% consommé). Création du marché bloquée.`;
    blockReason = 'blocked_100';
  } else if (!isAvailable) {
    message = `Budget insuffisant. Disponible: ${availableBudget.toLocaleString()} XOF, Demandé: ${requestedAmount.toLocaleString()} XOF`;
    blockReason = 'insufficient';
  }

  return {
    isAvailable,
    isBudgeted: true,
    isBlocked,
    availableBudget,
    forecastAmount,
    committedAmount,
    realizedAmount,
    consumptionPercentage,
    requestedAmount,
    message,
    blockReason,
  };
}

// Log blocked contract creation to audit
export async function logContractBudgetBlock(
  userId: string | undefined,
  budgetLineId: string,
  budgetLineDescription: string | null,
  requestedAmount: number,
  availableBudget: number,
  blockReason: ContractBudgetControlResult['blockReason'],
  contractObject: string
): Promise<void> {
  if (!userId) return;

  try {
    const reasonMessages: Record<NonNullable<ContractBudgetControlResult['blockReason']>, string> = {
      insufficient: 'Montant engagé supérieur au budget disponible',
      not_budgeted: 'Ligne budgétaire non budgétisée (prévision = 0)',
      missing_line: 'Ligne budgétaire introuvable',
      blocked_100: 'Budget épuisé (100% consommé)',
    };

    await supabase.rpc('log_audit_event', {
      _action: 'blocage_marche_engagement',
      _module: 'marches',
      _resource_type: 'contract',
      _resource_id: budgetLineId,
      _old_values: JSON.stringify({
        budget_line_id: budgetLineId,
        budget_line_description: budgetLineDescription,
        available_budget: availableBudget,
      }),
      _new_values: JSON.stringify({
        contract_object: contractObject,
        requested_amount: requestedAmount,
        blocked_reason: blockReason ? reasonMessages[blockReason] : 'Raison inconnue',
        block_type: blockReason,
      }),
    });

    console.log('Contract budget block logged to audit');
  } catch (error) {
    console.error('Failed to log contract budget block:', error);
  }
}

// Main validation function with toast notifications
export async function validateContractWithBudgetControl(
  budgetLineId: string | null | undefined,
  requestedAmount: number,
  budgetLines: BudgetLineInfo[] | undefined,
  userId: string | undefined,
  contractObject: string
): Promise<{ canProceed: boolean; result: ContractBudgetControlResult }> {
  const result = validateContractEngagement(budgetLineId, requestedAmount, budgetLines);

  // If no budget line selected, allow
  if (!budgetLineId) {
    return { canProceed: true, result };
  }

  if (!result.isAvailable) {
    const budgetLine = budgetLines?.find(bl => bl.id === budgetLineId);

    // Log to audit
    await logContractBudgetBlock(
      userId,
      budgetLineId,
      budgetLine?.description || null,
      requestedAmount,
      result.availableBudget,
      result.blockReason,
      contractObject
    );

    // Show toast
    toast({
      title: "Marché excédentaire bloqué",
      description: result.message || "Le montant engagé dépasse le budget disponible",
      variant: "destructive",
    });

    return { canProceed: false, result };
  }

  return { canProceed: true, result };
}
