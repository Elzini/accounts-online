/**
 * Fiscal Year - Shared balance computation utilities
 * DRY: This logic was duplicated 4x across closeFiscalYear, openNewFiscalYear,
 * refreshClosingEntry, and refreshOpeningBalances
 */
import { supabase } from '@/integrations/supabase/client';
import { isAccountType } from '@/utils/accountTypes';

export interface AccountBalance {
  balances: Map<string, number>;
  accounts: any[];
  revenueAccounts: any[];
  expenseAccounts: any[];
  retainedEarningsAccount: any | null;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

/**
 * Fetch all journal lines for a company up to a given end date,
 * compute net balances per account, and derive net income.
 */
export async function computeBalances(
  companyId: string,
  startDate?: string,
  endDate?: string,
  excludeClosing = false
): Promise<AccountBalance> {
  // Fetch accounts
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('*')
    .eq('company_id', companyId);

  if (!accounts) throw new Error('لا توجد حسابات');

  // Fetch journal lines
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id, debit, credit,
      journal_entry:journal_entries!inner(company_id, entry_date, is_posted, reference_type)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (startDate) query = query.gte('journal_entry.entry_date', startDate);
  if (endDate) query = query.lte('journal_entry.entry_date', endDate);

  const { data: journalLines } = await query;

  // Compute balances
  const balances = new Map<string, number>();
  (journalLines || []).forEach((line: any) => {
    if (excludeClosing && line.journal_entry?.reference_type === 'closing') return;
    const current = balances.get(line.account_id) || 0;
    const account = accounts.find(a => a.id === line.account_id);
    if (account && ['liability', 'liabilities', 'equity', 'revenue'].includes(account.type)) {
      balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
    } else {
      balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
    }
  });

  const revenueAccounts = accounts.filter(a => isAccountType(a.type, 'revenue'));
  const expenseAccounts = accounts.filter(a => isAccountType(a.type, 'expense'));
  const retainedEarningsAccount = accounts.find(a => a.code.startsWith('33')) || null;

  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + (balances.get(a.id) || 0), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Math.abs(balances.get(a.id) || 0), 0);

  return {
    balances,
    accounts,
    revenueAccounts,
    expenseAccounts,
    retainedEarningsAccount,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  };
}

/**
 * Build closing entry lines from revenue/expense balances
 */
export function buildClosingLines(
  balances: Map<string, number>,
  revenueAccounts: any[],
  expenseAccounts: any[],
  retainedEarningsAccountId: string,
  netIncome: number
): Array<{ account_id: string; debit: number; credit: number; description: string }> {
  const lines: Array<{ account_id: string; debit: number; credit: number; description: string }> = [];

  revenueAccounts.forEach(acc => {
    const balance = balances.get(acc.id) || 0;
    if (balance !== 0) {
      lines.push({ account_id: acc.id, debit: balance, credit: 0, description: `إقفال ${acc.name}` });
    }
  });

  expenseAccounts.forEach(acc => {
    const balance = balances.get(acc.id) || 0;
    if (balance !== 0) {
      lines.push({ account_id: acc.id, debit: 0, credit: Math.abs(balance), description: `إقفال ${acc.name}` });
    }
  });

  lines.push({
    account_id: retainedEarningsAccountId,
    debit: netIncome < 0 ? Math.abs(netIncome) : 0,
    credit: netIncome > 0 ? netIncome : 0,
    description: 'صافي الربح/الخسارة للسنة',
  });

  return lines;
}

/**
 * Build opening entry lines from balance sheet accounts
 */
export function buildOpeningLines(
  balances: Map<string, number>,
  accounts: any[],
  retainedEarningsAccount: any | null,
  netIncome: number,
  descPrefix = 'رصيد افتتاحي'
): Array<{ account_id: string; debit: number; credit: number; description: string }> {
  const balanceSheetAccounts = accounts.filter(a =>
    ['asset', 'assets', 'liability', 'liabilities', 'equity'].includes(a.type)
  );
  if (retainedEarningsAccount && !balanceSheetAccounts.find((a: any) => a.id === retainedEarningsAccount.id)) {
    balanceSheetAccounts.push(retainedEarningsAccount);
  }

  const lines: Array<{ account_id: string; debit: number; credit: number; description: string }> = [];

  balanceSheetAccounts.forEach((acc: any) => {
    let balance = balances.get(acc.id) || 0;
    if (retainedEarningsAccount && acc.id === retainedEarningsAccount.id) {
      balance += netIncome;
    }
    if (balance !== 0) {
      if (['asset', 'assets'].includes(acc.type)) {
        lines.push({
          account_id: acc.id,
          debit: balance > 0 ? balance : 0,
          credit: balance < 0 ? Math.abs(balance) : 0,
          description: `${descPrefix} - ${acc.name}`,
        });
      } else {
        lines.push({
          account_id: acc.id,
          debit: balance < 0 ? Math.abs(balance) : 0,
          credit: balance > 0 ? balance : 0,
          description: `${descPrefix} - ${acc.name}`,
        });
      }
    }
  });

  return lines;
}

/**
 * Ensure retained earnings account exists, creating if needed
 */
export async function ensureRetainedEarningsAccount(
  accounts: any[],
  existingAccount: any | null,
  companyId: string,
  netIncome: number
): Promise<any | null> {
  if (existingAccount) return existingAccount;
  if (netIncome === 0) return null;

  const equityParent = accounts.find(a => a.code === '31' && a.type === 'equity')
    || accounts.find(a => a.code === '3' && a.type === 'equity');

  const { data: newAcc } = await supabase
    .from('account_categories')
    .insert({
      code: '3301',
      name: 'أرباح مبقاة (محتجزة)',
      type: 'equity',
      company_id: companyId,
      parent_id: equityParent?.id || null,
      is_system: true,
    })
    .select()
    .single();

  return newAcc || null;
}
