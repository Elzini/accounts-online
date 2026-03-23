/**
 * Canonical account types (singular form).
 * All code should compare against these values.
 */
export type CanonicalAccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

const PLURAL_TO_SINGULAR: Record<string, CanonicalAccountType> = {
  assets: 'asset',
  asset: 'asset',
  liabilities: 'liability',
  liability: 'liability',
  equity: 'equity',
  revenue: 'revenue',
  expenses: 'expense',
  expense: 'expense',
  cogs: 'expense', // cost of goods sold treated as expense
};

/**
 * Normalizes any account type string (singular or plural) to canonical singular form.
 * Returns the original string lowercased if not recognized.
 */
export function normalizeAccountType(type: string): CanonicalAccountType {
  return PLURAL_TO_SINGULAR[type?.toLowerCase()] || (type?.toLowerCase() as CanonicalAccountType);
}

/**
 * Checks if the given type matches the target canonical type,
 * handling both singular and plural forms.
 */
export function isAccountType(type: string, target: CanonicalAccountType): boolean {
  return normalizeAccountType(type) === target;
}

/**
 * Credit-normal account types (balance increases with credit).
 */
export function isCreditNormal(type: string): boolean {
  const normalized = normalizeAccountType(type);
  return normalized === 'liability' || normalized === 'equity' || normalized === 'revenue';
}

/**
 * Debit-normal account types (balance increases with debit).
 */
export function isDebitNormal(type: string): boolean {
  return !isCreditNormal(type);
}

/**
 * Balance sheet account types (not closed at year-end).
 */
export function isBalanceSheetType(type: string): boolean {
  const normalized = normalizeAccountType(type);
  return normalized === 'asset' || normalized === 'liability' || normalized === 'equity';
}

/**
 * Income statement account types (closed at year-end).
 */
export function isIncomeStatementType(type: string): boolean {
  const normalized = normalizeAccountType(type);
  return normalized === 'revenue' || normalized === 'expense';
}
