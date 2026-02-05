/**
 * Contract financial calculations - Single source of truth
 * All monetary calculations for contracts should use these functions
 * to ensure consistency across the application.
 */

/**
 * Calculate TVA amount from HT amount and TVA rate
 * @param amountHT - Amount excluding tax
 * @param tvaRate - TVA percentage (e.g., 18 for 18%)
 * @returns TVA amount, rounded to whole number (FCFA has no decimals)
 */
export function calculateTVAAmount(amountHT: number, tvaRate: number): number {
  const ht = Number(amountHT) || 0;
  const rate = Number(tvaRate) || 0;
  return Math.round(ht * (rate / 100));
}

/**
 * Calculate total TTC amount from HT amount and TVA rate
 * @param amountHT - Amount excluding tax
 * @param tvaRate - TVA percentage (e.g., 18 for 18%)
 * @returns Total TTC amount, rounded to whole number
 */
export function calculateTotalTTC(amountHT: number, tvaRate: number): number {
  const ht = Number(amountHT) || 0;
  const tva = calculateTVAAmount(amountHT, tvaRate);
  return Math.round(ht + tva);
}

/**
 * Calculate remaining amount for a contract
 * @param totalAmount - Total contract amount (TTC)
 * @param paidAmount - Amount already paid
 * @returns Remaining amount to be paid
 */
export function calculateRemainingAmount(totalAmount: number, paidAmount: number): number {
  const total = Number(totalAmount) || 0;
  const paid = Number(paidAmount) || 0;
  return Math.max(0, Math.round(total - paid));
}

/**
 * Calculate progress percentage based on paid amount vs total
 * @param totalAmount - Total contract amount
 * @param paidAmount - Amount already paid
 * @returns Progress percentage (0-100)
 */
export function calculateProgressPercentage(totalAmount: number, paidAmount: number): number {
  const total = Number(totalAmount) || 0;
  const paid = Number(paidAmount) || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}

/**
 * Format currency for display - FCFA (no decimals)
 * @param amount - Amount to format
 * @param includeCurrency - Whether to include "FCFA" suffix
 * @returns Formatted string
 */
export function formatContractAmount(amount: number, includeCurrency: boolean = true): string {
  const value = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  
  return includeCurrency ? `${formatted} FCFA` : formatted;
}

/**
 * Contract financial summary - computed from raw data
 */
export interface ContractFinancialSummary {
  totalAmount: number;
  engagedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progressPercentage: number;
}

/**
 * Get computed financial summary for a contract
 * Uses stored values with fallback calculations
 */
export function getContractFinancialSummary(contract: {
  total_amount: number;
  engaged_amount?: number | null;
  paid_amount?: number | null;
  remaining_amount?: number | null;
  progress_percentage?: number | null;
}): ContractFinancialSummary {
  const totalAmount = Math.round(Number(contract.total_amount) || 0);
  const paidAmount = Math.round(Number(contract.paid_amount) || 0);
  const engagedAmount = Math.round(Number(contract.engaged_amount) || 0);
  
  // remaining_amount: use stored value if valid, otherwise calculate
  const storedRemaining = Number(contract.remaining_amount);
  const calculatedRemaining = calculateRemainingAmount(totalAmount, paidAmount);
  const remainingAmount = !isNaN(storedRemaining) && storedRemaining >= 0 
    ? Math.round(storedRemaining) 
    : calculatedRemaining;
  
  // progress_percentage: use stored value if valid, otherwise calculate
  const storedProgress = Number(contract.progress_percentage);
  const calculatedProgress = calculateProgressPercentage(totalAmount, paidAmount);
  const progressPercentage = !isNaN(storedProgress) && storedProgress >= 0 
    ? Math.round(storedProgress) 
    : calculatedProgress;
  
  return {
    totalAmount,
    engagedAmount,
    paidAmount,
    remainingAmount,
    progressPercentage,
  };
}

/**
 * Validate contract amounts before save
 * @returns Object with isValid flag and error messages
 */
export function validateContractAmounts(data: {
  amountHT: number;
  tvaRate: number;
  totalTTC: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.amountHT < 0) {
    errors.push('Le montant HT ne peut pas être négatif');
  }
  
  if (data.tvaRate < 0 || data.tvaRate > 100) {
    errors.push('Le taux de TVA doit être entre 0 et 100%');
  }
  
  // Verify TTC calculation is correct
  const expectedTTC = calculateTotalTTC(data.amountHT, data.tvaRate);
  if (Math.abs(data.totalTTC - expectedTTC) > 1) {
    errors.push('Le montant TTC calculé est incorrect');
  }
  
  // Reasonable amount check (max 1 trillion FCFA)
  if (data.totalTTC > 1000000000000) {
    errors.push('Le montant semble anormalement élevé');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
