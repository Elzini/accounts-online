/**
 * Unified VAT Calculator
 * Single source of truth for all VAT calculations across the system.
 * Replaces hardcoded 0.15, *1.15, 15/115 scattered in components.
 */
import { calcCarTax } from '@/utils/carTaxHelper';
import { GENERAL_TAX_RULES } from '@/core/engine/taxRules';

/** Default Saudi VAT rate */
export const DEFAULT_VAT_RATE = 15;

/** Calculate VAT on a given amount (standard method) */
export function calcStandardVAT(amount: number, rate: number = DEFAULT_VAT_RATE): { vatAmount: number; totalWithVAT: number } {
  const vatAmount = amount * rate / 100;
  return { vatAmount, totalWithVAT: amount + vatAmount };
}

/** Extract VAT from a tax-inclusive amount */
export function extractVATFromInclusive(inclusiveAmount: number, rate: number = DEFAULT_VAT_RATE): { vatAmount: number; netAmount: number } {
  const vatAmount = inclusiveAmount * rate / (100 + rate);
  return { vatAmount, netAmount: inclusiveAmount - vatAmount };
}

/** Calculate car-specific VAT (delegates to carTaxHelper → taxRules engine) */
export { calcCarTax } from '@/utils/carTaxHelper';

/** General-purpose tax calculation for non-car items */
export function calcGeneralVAT(
  amount: number,
  transactionType: 'sale' | 'purchase',
  rate: number = DEFAULT_VAT_RATE
): { taxAmount: number; subtotal: number; total: number } {
  const taxAmount = amount * rate / 100;
  return { taxAmount, subtotal: amount, total: amount + taxAmount };
}
