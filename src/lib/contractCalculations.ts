/**
 * Contract financial utilities - SSOT Architecture
 * 
 * IMPORTANT: All calculations are performed by the database trigger
 * (calculate_contract_amounts). These utilities are for:
 * 1. Formatting display values
 * 2. Type definitions
 * 3. Preview calculations in forms (before save)
 * 
 * DO NOT use these for actual business calculations - the database is the source of truth.
 */

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
 * Contract source data (inputs for calculation)
 */
export interface ContractSourceData {
  quantity: number;
  unit_price: number;
  tva_rate: number;
  discount_rate: number;
  additional_fees: number;
  advances: number;
  penalties: number;
}

/**
 * Contract calculated values (computed by database trigger)
 */
export interface ContractCalculatedValues {
  gross_amount: number;
  discount_amount: number;
  after_discount_amount: number;
  tva_amount: number;
  total_amount: number;
  net_amount: number;
  remaining_amount: number;
  execution_rate: number;
  progress_percentage: number;
  financial_status: string;
}

/**
 * Full contract financial summary
 */
export interface ContractFinancialSummary {
  // Source data
  source: ContractSourceData;
  // Calculated values (from DB)
  calculated: ContractCalculatedValues;
  // Execution tracking
  paidAmount: number;
  engagedAmount: number;
}

/**
 * Get financial summary from a contract object
 * All values come directly from the database - no frontend calculations
 */
export function getContractFinancialSummary(contract: {
  quantity?: number | null;
  unit_price?: number | null;
  tva_rate?: number | null;
  discount_rate?: number | null;
  additional_fees?: number | null;
  advances?: number | null;
  penalties?: number | null;
  gross_amount?: number | null;
  discount_amount?: number | null;
  after_discount_amount?: number | null;
  tva_amount?: number | null;
  total_amount: number;
  net_amount?: number | null;
  remaining_amount?: number | null;
  execution_rate?: number | null;
  progress_percentage?: number | null;
  financial_status?: string | null;
  paid_amount?: number | null;
  engaged_amount?: number | null;
}): ContractFinancialSummary {
  return {
    source: {
      quantity: Number(contract.quantity) || 1,
      unit_price: Number(contract.unit_price) || 0,
      tva_rate: Number(contract.tva_rate) || 0,
      discount_rate: Number(contract.discount_rate) || 0,
      additional_fees: Number(contract.additional_fees) || 0,
      advances: Number(contract.advances) || 0,
      penalties: Number(contract.penalties) || 0,
    },
    calculated: {
      gross_amount: Number(contract.gross_amount) || 0,
      discount_amount: Number(contract.discount_amount) || 0,
      after_discount_amount: Number(contract.after_discount_amount) || 0,
      tva_amount: Number(contract.tva_amount) || 0,
      total_amount: Number(contract.total_amount) || 0,
      net_amount: Number(contract.net_amount) || 0,
      remaining_amount: Number(contract.remaining_amount) || 0,
      execution_rate: Number(contract.execution_rate) || 0,
      progress_percentage: Number(contract.progress_percentage) || 0,
      financial_status: contract.financial_status || 'En cours',
    },
    paidAmount: Number(contract.paid_amount) || 0,
    engagedAmount: Number(contract.engaged_amount) || 0,
  };
}

/**
 * Preview calculations for form display (before saving to DB)
 * These are ONLY for UI preview - actual values come from DB trigger
 */
export function previewContractCalculations(source: ContractSourceData): ContractCalculatedValues {
  const grossAmount = Math.round(source.quantity * source.unit_price);
  const discountAmount = Math.round(grossAmount * source.discount_rate / 100);
  const afterDiscountAmount = grossAmount - discountAmount;
  const tvaAmount = Math.round(afterDiscountAmount * source.tva_rate / 100);
  const totalTTC = afterDiscountAmount + tvaAmount + source.additional_fees;
  const netAmount = totalTTC - source.advances - source.penalties;

  return {
    gross_amount: grossAmount,
    discount_amount: discountAmount,
    after_discount_amount: afterDiscountAmount,
    tva_amount: tvaAmount,
    total_amount: totalTTC,
    net_amount: netAmount,
    remaining_amount: totalTTC, // Initially = total
    execution_rate: 0,
    progress_percentage: 0,
    financial_status: 'En cours',
  };
}

/**
 * @deprecated - Use database trigger instead
 * Kept for backwards compatibility only
 */
export function calculateTVAAmount(amountHT: number, tvaRate: number): number {
  console.warn('calculateTVAAmount is deprecated - use database trigger instead');
  return Math.round((Number(amountHT) || 0) * (Number(tvaRate) || 0) / 100);
}

/**
 * @deprecated - Use database trigger instead
 * Kept for backwards compatibility only
 */
export function calculateTotalTTC(amountHT: number, tvaRate: number): number {
  console.warn('calculateTotalTTC is deprecated - use database trigger instead');
  const ht = Number(amountHT) || 0;
  const tva = calculateTVAAmount(amountHT, tvaRate);
  return Math.round(ht + tva);
}

/**
 * @deprecated - Use database trigger instead
 * Kept for backwards compatibility only
 */
export function calculateRemainingAmount(totalAmount: number, paidAmount: number): number {
  console.warn('calculateRemainingAmount is deprecated - use database trigger instead');
  return Math.max(0, Math.round((Number(totalAmount) || 0) - (Number(paidAmount) || 0)));
}

/**
 * @deprecated - Use database trigger instead
 * Kept for backwards compatibility only
 */
export function calculateProgressPercentage(totalAmount: number, paidAmount: number): number {
  console.warn('calculateProgressPercentage is deprecated - use database trigger instead');
  const total = Number(totalAmount) || 0;
  const paid = Number(paidAmount) || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}

/**
 * @deprecated - Validation is now handled by database constraints
 * Kept for backwards compatibility only
 */
export function validateContractAmounts(data: {
  amountHT: number;
  tvaRate: number;
  totalTTC: number;
}): { isValid: boolean; errors: string[] } {
  console.warn('validateContractAmounts is deprecated - database handles validation');
  return { isValid: true, errors: [] };
}
