/**
 * Tax Rules Configuration
 * Replaces hardcoded VAT logic with configurable rules.
 * Supports both Module defaults and DB overrides.
 */

/** Tax calculation method */
export type TaxMethod = 
  | 'standard'        // VAT on full amount
  | 'margin_scheme'   // VAT on profit margin only (used cars, antiques)
  | 'zero_rated'      // 0% VAT
  | 'exempt';         // No VAT applicable

/** A single tax rule configuration */
export interface TaxRule {
  /** Unique identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Tax calculation method */
  method: TaxMethod;
  /** Default tax rate (percentage) */
  rate: number;
  /** When does this rule apply? */
  appliesTo: {
    /** Item condition (e.g., 'new', 'used') */
    itemCondition?: string;
    /** Transaction type */
    transactionType?: 'sale' | 'purchase' | 'both';
  };
  /** For margin_scheme: is the margin tax-inclusive? */
  marginInclusive?: boolean;
}

/** Tax rules configuration for a module */
export interface TaxRulesConfig {
  /** Default tax rate when no specific rule matches */
  defaultRate: number;
  /** Default tax name */
  taxName: string;
  /** Ordered list of rules (first match wins) */
  rules: TaxRule[];
}

/**
 * Find the matching tax rule for given parameters.
 * Returns the first matching rule, or null if no specific rule matches.
 */
export function findTaxRule(
  config: TaxRulesConfig,
  itemCondition?: string,
  transactionType?: 'sale' | 'purchase'
): TaxRule | null {
  return config.rules.find(rule => {
    const condMatch = !rule.appliesTo.itemCondition || 
      rule.appliesTo.itemCondition === itemCondition;
    const typeMatch = !rule.appliesTo.transactionType || 
      rule.appliesTo.transactionType === 'both' || 
      rule.appliesTo.transactionType === transactionType;
    return condMatch && typeMatch;
  }) || null;
}

/**
 * Calculate tax amount using a tax rule.
 */
export function calculateTax(
  rule: TaxRule | null,
  defaultRate: number,
  amount: number,
  purchasePrice?: number
): { taxAmount: number; method: TaxMethod; rate: number } {
  if (!rule) {
    // Standard calculation with default rate
    return {
      taxAmount: amount * defaultRate / 100,
      method: 'standard',
      rate: defaultRate,
    };
  }

  switch (rule.method) {
    case 'margin_scheme': {
      const margin = Math.max(0, amount - (purchasePrice || 0));
      const taxAmount = rule.marginInclusive
        ? margin * rule.rate / (100 + rule.rate)
        : margin * rule.rate / 100;
      return { taxAmount, method: 'margin_scheme', rate: rule.rate };
    }
    case 'zero_rated':
      return { taxAmount: 0, method: 'zero_rated', rate: 0 };
    case 'exempt':
      return { taxAmount: 0, method: 'exempt', rate: 0 };
    case 'standard':
    default:
      return {
        taxAmount: amount * rule.rate / 100,
        method: 'standard',
        rate: rule.rate,
      };
  }
}

// ── Default Configurations per Industry ──

export const CAR_DEALERSHIP_TAX_RULES: TaxRulesConfig = {
  defaultRate: 15,
  taxName: 'ضريبة القيمة المضافة',
  rules: [
    {
      id: 'car-new-sale',
      label: 'سيارة جديدة - بيع',
      method: 'standard',
      rate: 15,
      appliesTo: { itemCondition: 'new', transactionType: 'sale' },
    },
    {
      id: 'car-used-sale',
      label: 'سيارة مستعملة - بيع (هامش الربح)',
      method: 'margin_scheme',
      rate: 15,
      appliesTo: { itemCondition: 'used', transactionType: 'sale' },
      marginInclusive: true,
    },
    {
      id: 'car-new-purchase',
      label: 'سيارة جديدة - شراء',
      method: 'standard',
      rate: 15,
      appliesTo: { itemCondition: 'new', transactionType: 'purchase' },
    },
    {
      id: 'car-used-purchase',
      label: 'سيارة مستعملة - شراء (معفاة)',
      method: 'zero_rated',
      rate: 0,
      appliesTo: { itemCondition: 'used', transactionType: 'purchase' },
    },
  ],
};

export const GENERAL_TAX_RULES: TaxRulesConfig = {
  defaultRate: 15,
  taxName: 'ضريبة القيمة المضافة',
  rules: [
    {
      id: 'standard-sale',
      label: 'بيع قياسي',
      method: 'standard',
      rate: 15,
      appliesTo: { transactionType: 'sale' },
    },
    {
      id: 'standard-purchase',
      label: 'شراء قياسي',
      method: 'standard',
      rate: 15,
      appliesTo: { transactionType: 'purchase' },
    },
  ],
};
