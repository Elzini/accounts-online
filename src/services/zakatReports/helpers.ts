import { supabase } from '@/hooks/modules/useMiscServices';
import { fetchAccounts, AccountCategory } from '../accounting';

export { fetchAccounts };
export type { AccountCategory };

export async function calculateActualNetIncome(
  companyId: string, startDate: string, endDate: string
): Promise<{ salesRevenue: number; purchaseCost: number; carExpenses: number; generalExpenses: number; netIncome: number }> {
  const accounts = await fetchAccounts(companyId);
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, entry_date, is_posted)')
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .gte('journal_entry.entry_date', startDate)
    .lte('journal_entry.entry_date', endDate);
  if (error) throw error;

  const balances = new Map<string, number>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || 0;
    const account = accounts.find(a => a.id === line.account_id);
    if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
      balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
    } else {
      balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
    }
  });

  const salesRevenue = accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + (balances.get(a.id) || 0), 0);
  const purchaseCost = accounts.filter(a => a.type === 'expenses' && a.code.startsWith('51')).reduce((sum, a) => sum + Math.abs(balances.get(a.id) || 0), 0);
  const generalExpenses = accounts.filter(a => a.type === 'expenses' && !a.code.startsWith('51')).reduce((sum, a) => sum + Math.abs(balances.get(a.id) || 0), 0);

  return { salesRevenue, purchaseCost, carExpenses: 0, generalExpenses, netIncome: salesRevenue - purchaseCost - generalExpenses };
}

export async function fetchJournalBalances(companyId: string, startDate: string, endDate: string, accounts: AccountCategory[]) {
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, entry_date, is_posted)')
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .gte('journal_entry.entry_date', startDate)
    .lte('journal_entry.entry_date', endDate);
  if (error) throw error;

  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    balances.set(line.account_id, current);
  });

  const getBalance = (accountId: string, type: string) => {
    const totals = balances.get(accountId) || { debit: 0, credit: 0 };
    if (['liabilities', 'equity', 'revenue'].includes(type)) return totals.credit - totals.debit;
    return totals.debit - totals.credit;
  };

  return { balances, getBalance };
}
