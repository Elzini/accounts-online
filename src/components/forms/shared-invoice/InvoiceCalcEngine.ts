/**
 * Shared Invoice Calculation Engine
 * Unified tax calculation logic used by both Sales and Purchase invoice forms.
 */
import { findTaxRule, calculateTax, CAR_DEALERSHIP_TAX_RULES } from '@/core/engine/taxRules';

export interface CalcItemResult {
  baseAmount: number;
  vatAmount: number;
  total: number;
}

/**
 * Calculate base amount, VAT, and total for a line item.
 * Handles both tax-inclusive and tax-exclusive pricing.
 */
export function calcLineItem(
  price: number,
  quantity: number,
  taxRate: number,
  priceIncludesTax: boolean,
  itemTaxRateOverride?: number
): CalcItemResult {
  const effectiveTaxRate = itemTaxRateOverride ?? taxRate;
  let baseAmount: number, vatAmount: number, total: number;

  if (priceIncludesTax && effectiveTaxRate > 0) {
    total = price * quantity;
    baseAmount = total / (1 + effectiveTaxRate / 100);
    vatAmount = total - baseAmount;
  } else {
    baseAmount = price * quantity;
    vatAmount = baseAmount * (effectiveTaxRate / 100);
    total = baseAmount + vatAmount;
  }

  return { baseAmount, vatAmount, total };
}

/**
 * Calculate used car VAT (margin scheme: VAT on profit margin only).
 * @deprecated Use calcCarTax from '@/utils/carTaxHelper' instead.
 */
export function calcUsedCarVat(
  salePrice: number,
  purchasePrice: number,
  quantity: number,
  taxRate: number
): CalcItemResult {
  
  const rule = findTaxRule(CAR_DEALERSHIP_TAX_RULES, 'used', 'sale');
  const baseAmount = salePrice * quantity;
  const totalPurchase = purchasePrice * quantity;
  const result = calculateTax(rule, taxRate, baseAmount, totalPurchase);
  const total = baseAmount + result.taxAmount;
  return { baseAmount, vatAmount: result.taxAmount, total };
}

/**
 * Calculate discount amount from either percentage or fixed amount.
 */
export function calcDiscount(
  subtotal: number,
  discount: number,
  discountType: 'percentage' | 'amount'
): number {
  return discountType === 'percentage' ? subtotal * (discount / 100) : discount;
}

/**
 * Format currency value with configurable decimals.
 */
export function formatInvoiceCurrency(value: number, decimals: number): string {
  const v = decimals === 0 ? Math.round(value) : value;
  return decimals === 0 ? String(v) : v.toFixed(decimals);
}
