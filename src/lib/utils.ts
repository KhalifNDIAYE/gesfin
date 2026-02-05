import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @param currency - Currency code (unused but kept for compatibility)
 * @returns Formatted string with "FCFA" suffix
 */
export function formatCurrency(amount: number, currency: string = 'XOF'): string {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value)) + ' FCFA';
}
