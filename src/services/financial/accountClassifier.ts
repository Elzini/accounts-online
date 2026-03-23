/**
 * Account Classifier - Classifies accounts by type and code prefix
 * Extracted from systemFinancialData.ts God Function
 */
import { AccountCategory } from '../accounting';

export interface ClassifiedAccounts {
  leafAccounts: AccountCategory[];
  assetAccounts: AccountCategory[];
  liabilityAccounts: AccountCategory[];
  equityAccounts: AccountCategory[];
  revenueAccounts: AccountCategory[];
  expenseAccounts: AccountCategory[];
}

export interface AccountBalanceMap {
  balances: Map<string, { debit: number; credit: number }>;
}

const typeMatch = (a: { type: string }, ...types: string[]) => types.includes(a.type);

export function getLeafAccounts(accounts: AccountCategory[]): AccountCategory[] {
  const parentIds = new Set(accounts.filter(a => a.parent_id).map(a => a.parent_id!));
  return accounts.filter(a => !parentIds.has(a.id));
}

export function classifyAccounts(leafAccounts: AccountCategory[]): ClassifiedAccounts {
  return {
    leafAccounts,
    assetAccounts: leafAccounts.filter(a => typeMatch(a, 'asset', 'assets')),
    liabilityAccounts: leafAccounts.filter(a => typeMatch(a, 'liability', 'liabilities')),
    equityAccounts: leafAccounts.filter(a => typeMatch(a, 'equity')),
    revenueAccounts: leafAccounts.filter(a => typeMatch(a, 'revenue')),
    expenseAccounts: leafAccounts.filter(a => typeMatch(a, 'expense', 'expenses')),
  };
}

/** Get net balance based on account nature */
export function getBalance(account: AccountCategory, balances: Map<string, { debit: number; credit: number }>): number {
  const totals = balances.get(account.id) || { debit: 0, credit: 0 };
  if (['liability', 'liabilities', 'equity', 'revenue'].includes(account.type)) {
    return totals.credit - totals.debit;
  }
  return totals.debit - totals.credit;
}

export function getPositiveCreditBalance(account: AccountCategory, balances: Map<string, { debit: number; credit: number }>): number {
  return Math.max(0, getBalance(account, balances));
}

export function getPositiveDebitBalance(account: AccountCategory, balances: Map<string, { debit: number; credit: number }>): number {
  return Math.max(0, -getBalance(account, balances));
}
