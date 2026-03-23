/**
 * Shared car tax calculation helper.
 * Bridges the configurable taxRules engine with existing component code.
 * All car VAT logic should go through this helper.
 */
import { findTaxRule, calculateTax, CAR_DEALERSHIP_TAX_RULES } from '@/core/engine/taxRules';
import type { TaxRulesConfig } from '@/core/engine/taxRules';

/**
 * Calculate car tax based on condition and transaction type.
 * Replaces all hardcoded margin scheme logic.
 */
export function calcCarTax(
  amount: number,
  carCondition: string | undefined | null,
  transactionType: 'sale' | 'purchase',
  taxRate: number,
  purchasePrice?: number,
  config?: TaxRulesConfig
): { taxAmount: number; subtotal: number; total: number } {
  const rules = config || CAR_DEALERSHIP_TAX_RULES;
  const normalizedCondition = normalizeCondition(carCondition);
  const rule = findTaxRule(rules, normalizedCondition, transactionType);
  const result = calculateTax(rule, taxRate, amount, purchasePrice);

  if (transactionType === 'sale') {
    if (rule?.method === 'margin_scheme') {
      // Margin scheme: subtotal = sale price, tax added on top
      return { taxAmount: result.taxAmount, subtotal: amount, total: amount + result.taxAmount };
    }
    // Standard: price is tax-inclusive, extract tax
    const taxAmount = amount * (taxRate / (100 + taxRate));
    return { taxAmount, subtotal: amount - taxAmount, total: amount };
  }

  // Purchase: price is tax-inclusive
  return { taxAmount: result.taxAmount, subtotal: amount - result.taxAmount, total: amount };
}

function normalizeCondition(condition: string | undefined | null): string {
  if (!condition) return 'new';
  if (condition === 'مستعملة' || condition === 'used') return 'used';
  return condition;
}
