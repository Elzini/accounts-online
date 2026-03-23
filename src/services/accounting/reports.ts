/**
 * Accounting Reports - Facade (backward compatibility)
 * All implementations split into focused modules.
 * 930 lines → thin re-export + remaining simple reports (~250 lines)
 */
import { supabase } from '@/integrations/supabase/client';
import { AccountCategory, JournalEntryLine, VATSettlementReport } from './types';
import { fetchAccounts } from './accounts';
import { isAccountType, isCreditNormal, isBalanceSheetType } from '@/utils/accountTypes';

// ── Re-exports from extracted modules ──
export { getGeneralLedger } from './generalLedger';
export { getComprehensiveTrialBalance } from './comprehensiveTrialBalance';

// ── Account Balances (simple, ~50 lines) ──
export async function getAccountBalances(
  companyId: string, startDate?: string, endDate?: string, fiscalYearId?: string
): Promise<Array<{ account: AccountCategory; debit_total: number; credit_total: number; balance: number }>> {
  const accounts = await fetchAccounts(companyId);
  let query = supabase
    .from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, fiscal_year_id)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);

  if (fiscalYearId) query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  if (startDate) query = query.gte('journal_entry.entry_date', startDate);
  if (endDate) query = query.lte('journal_entry.entry_date', endDate);

  const { data: lines, error } = await query;
  if (error) throw error;

  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const c = balances.get(line.account_id) || { debit: 0, credit: 0 };
    c.debit += Number(line.debit) || 0; c.credit += Number(line.credit) || 0;
    balances.set(line.account_id, c);
  });

  return accounts.map(account => {
    const totals = balances.get(account.id) || { debit: 0, credit: 0 };
    let balance = totals.debit - totals.credit;
    if (['liabilities', 'equity', 'revenue'].includes(account.type)) balance = totals.credit - totals.debit;
    return { account, debit_total: totals.debit, credit_total: totals.credit, balance };
  }).filter(item => item.debit_total > 0 || item.credit_total > 0);
}

// ── Trial Balance ──
export async function getTrialBalance(
  companyId: string, startDate?: string, endDate?: string, fiscalYearId?: string
): Promise<{ accounts: Array<{ account: AccountCategory; debit: number; credit: number; isParent?: boolean; level?: number }>; totalDebit: number; totalCredit: number }> {
  const accounts = await fetchAccounts(companyId);
  let query = supabase
    .from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, fiscal_year_id)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);

  if (fiscalYearId) query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  else {
    if (startDate) query = query.gte('journal_entry.entry_date', startDate);
    if (endDate) query = query.lte('journal_entry.entry_date', endDate);
  }

  const { data: lines, error } = await query;
  if (error) throw error;

  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const c = balances.get(line.account_id) || { debit: 0, credit: 0 };
    c.debit += Number(line.debit) || 0; c.credit += Number(line.credit) || 0;
    balances.set(line.account_id, c);
  });

  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const childrenOf = (parentId: string) => accounts.filter(a => a.parent_id === parentId);

  const aggregateCache = new Map<string, { debit: number; credit: number }>();
  const getAggregated = (accountId: string): { debit: number; credit: number } => {
    if (aggregateCache.has(accountId)) return aggregateCache.get(accountId)!;
    const own = balances.get(accountId) || { debit: 0, credit: 0 };
    const children = childrenOf(accountId);
    let totalD = own.debit, totalC = own.credit;
    for (const child of children) { const c = getAggregated(child.id); totalD += c.debit; totalC += c.credit; }
    const result = { debit: totalD, credit: totalC };
    aggregateCache.set(accountId, result);
    return result;
  };
  accounts.forEach(a => getAggregated(a.id));

  const trialAccounts: Array<{ account: AccountCategory; debit: number; credit: number; isParent: boolean; level: number }> = [];
  const rootAccounts = accounts.filter(a => !a.parent_id || !accountMap.has(a.parent_id));

  const addHierarchy = (account: AccountCategory, level: number) => {
    const children = childrenOf(account.id);
    const hasChildren = children.length > 0;
    const agg = getAggregated(account.id);
    if (agg.debit === 0 && agg.credit === 0) return;
    trialAccounts.push({ account, debit: agg.debit, credit: agg.credit, isParent: hasChildren, level });
    if (hasChildren) children.sort((a, b) => a.code.localeCompare(b.code)).forEach(c => addHierarchy(c, level + 1));
  };
  rootAccounts.sort((a, b) => a.code.localeCompare(b.code)).forEach(a => addHierarchy(a, 0));

  const leafAccounts = trialAccounts.filter(a => !a.isParent);
  return { accounts: trialAccounts, totalDebit: leafAccounts.reduce((s, a) => s + a.debit, 0), totalCredit: leafAccounts.reduce((s, a) => s + a.credit, 0) };
}

// ── Income Statement ──
export async function getIncomeStatement(companyId: string, startDate?: string, endDate?: string, fiscalYearId?: string): Promise<{
  revenue: Array<{ account: AccountCategory; amount: number }>; expenses: Array<{ account: AccountCategory; amount: number }>;
  totalRevenue: number; totalExpenses: number; netIncome: number;
}> {
  let query = supabase.from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, entry_date, is_posted, fiscal_year_id)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
  if (fiscalYearId) query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  else { if (startDate) query = query.gte('journal_entry.entry_date', startDate); if (endDate) query = query.lte('journal_entry.entry_date', endDate); }
  const { data: lines, error } = await query;
  if (error) throw error;

  const accounts = await fetchAccounts(companyId);
  const balances = new Map<string, number>();
  (lines || []).forEach((line: any) => { balances.set(line.account_id, (balances.get(line.account_id) || 0) + (Number(line.credit) - Number(line.debit))); });

  const revenue = accounts.filter(a => isAccountType(a.type, 'revenue')).map(a => ({ account: a, amount: balances.get(a.id) || 0 })).filter(r => r.amount !== 0);
  const expenses = accounts.filter(a => isAccountType(a.type, 'expense')).map(a => ({ account: a, amount: Math.abs(balances.get(a.id) || 0) })).filter(e => e.amount !== 0);
  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  return { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
}

// ── Balance Sheet ──
export async function getBalanceSheet(companyId: string, startDate?: string, endDate?: string, fiscalYearId?: string): Promise<{
  currentAssets: Array<{ account: AccountCategory; balance: number }>; fixedAssets: Array<{ account: AccountCategory; balance: number }>;
  currentLiabilities: Array<{ account: AccountCategory; balance: number }>; longTermLiabilities: Array<{ account: AccountCategory; balance: number }>;
  equity: Array<{ account: AccountCategory; balance: number }>;
  totalCurrentAssets: number; totalFixedAssets: number; totalAssets: number;
  totalCurrentLiabilities: number; totalLongTermLiabilities: number; totalLiabilities: number; totalEquity: number; retainedEarnings: number;
}> {
  const accounts = await fetchAccounts(companyId);
  let query = supabase.from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, fiscal_year_id)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
  if (fiscalYearId) query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  else { if (startDate) query = query.gte('journal_entry.entry_date', startDate); if (endDate) query = query.lte('journal_entry.entry_date', endDate); }
  const { data: lines, error } = await query;
  if (error) throw error;

  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => { const c = balances.get(line.account_id) || { debit: 0, credit: 0 }; c.debit += Number(line.debit) || 0; c.credit += Number(line.credit) || 0; balances.set(line.account_id, c); });

  const calcBal = (account: AccountCategory) => { const t = balances.get(account.id) || { debit: 0, credit: 0 }; return isCreditNormal(account.type) ? t.credit - t.debit : t.debit - t.credit; };

  const currentAssetCodes = ['11', '12', '13'];
  const currentLiabilityCodes = ['21', '22'];
  const assetAccs = accounts.filter(a => isAccountType(a.type, 'asset'));
  const liabAccs = accounts.filter(a => isAccountType(a.type, 'liability'));
  const equityAccs = accounts.filter(a => isAccountType(a.type, 'equity'));

  const currentAssets = assetAccs.filter(a => currentAssetCodes.some(c => a.code.startsWith(c))).map(a => ({ account: a, balance: calcBal(a) })).filter(a => a.balance !== 0);
  const fixedAssets = assetAccs.filter(a => !currentAssetCodes.some(c => a.code.startsWith(c))).map(a => ({ account: a, balance: calcBal(a) })).filter(a => a.balance !== 0);
  const currentLiabilities = liabAccs.filter(a => currentLiabilityCodes.some(c => a.code.startsWith(c))).map(a => ({ account: a, balance: calcBal(a) })).filter(l => l.balance !== 0);
  const longTermLiabilities = liabAccs.filter(a => !currentLiabilityCodes.some(c => a.code.startsWith(c))).map(a => ({ account: a, balance: calcBal(a) })).filter(l => l.balance !== 0);
  const equity = equityAccs.map(a => ({ account: a, balance: calcBal(a) })).filter(e => e.balance !== 0);

  const totalRevenue = accounts.filter(a => isAccountType(a.type, 'revenue')).reduce((s, a) => s + calcBal(a), 0);
  const totalExpenses = accounts.filter(a => isAccountType(a.type, 'expense')).reduce((s, a) => s + Math.abs(calcBal(a)), 0);
  const retainedEarnings = totalRevenue - totalExpenses;

  const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.balance, 0);
  const totalFixedAssets = fixedAssets.reduce((s, a) => s + a.balance, 0);
  const totalCurrentLiabilities = currentLiabilities.reduce((s, l) => s + l.balance, 0);
  const totalLongTermLiabilities = longTermLiabilities.reduce((s, l) => s + l.balance, 0);

  return {
    currentAssets, fixedAssets, currentLiabilities, longTermLiabilities, equity,
    totalCurrentAssets, totalFixedAssets, totalAssets: totalCurrentAssets + totalFixedAssets,
    totalCurrentLiabilities, totalLongTermLiabilities,
    totalLiabilities: totalCurrentLiabilities + totalLongTermLiabilities,
    totalEquity: equity.reduce((s, e) => s + e.balance, 0) + retainedEarnings, retainedEarnings,
  };
}

// ── Vouchers Report ──
export async function getVouchersReport(
  companyId: string, startDate?: string, endDate?: string, voucherType?: 'receipt' | 'payment', fiscalYearId?: string
): Promise<Array<{ id: string; voucher_number: number; voucher_date: string; voucher_type: string; description: string; amount: number; payment_method: string | null; related_to: string | null }>> {
  let query = (supabase as any).from('vouchers').select('*').eq('company_id', companyId).order('voucher_date', { ascending: false });
  if (fiscalYearId) query = query.eq('fiscal_year_id', fiscalYearId);
  else { if (startDate) query = query.gte('voucher_date', startDate); if (endDate) query = query.lte('voucher_date', endDate); }
  if (voucherType) query = query.eq('voucher_type', voucherType);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ── Journal Entries Report ──
export async function getJournalEntriesReport(
  companyId: string, startDate?: string, endDate?: string, referenceType?: string, fiscalYearId?: string
): Promise<Array<{ id: string; entry_number: number; entry_date: string; description: string; reference_type: string | null; total_debit: number; total_credit: number; lines: JournalEntryLine[] }>> {
  let query = supabase.from('journal_entries')
    .select('*, lines:journal_entry_lines(*, account:account_categories(*))')
    .eq('company_id', companyId).eq('is_posted', true).order('entry_date', { ascending: false });
  if (fiscalYearId) query = query.eq('fiscal_year_id', fiscalYearId);
  else { if (startDate) query = query.gte('entry_date', startDate); if (endDate) query = query.lte('entry_date', endDate); }
  if (referenceType) query = query.eq('reference_type', referenceType);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as any;
}

// ── VAT Settlement Report ──
export async function getVATSettlementReport(
  companyId: string, startDate?: string, endDate?: string, fiscalYearId?: string
): Promise<VATSettlementReport> {
  const { data: settings, error: settingsError } = await supabase
    .from('company_accounting_settings').select('vat_payable_account_id, vat_recoverable_account_id')
    .eq('company_id', companyId).maybeSingle();
  if (settingsError) throw settingsError;

  const accounts = await fetchAccounts(companyId);
  const vatPayableAccount = settings?.vat_payable_account_id ? accounts.find(a => a.id === settings.vat_payable_account_id) : accounts.find(a => a.code === '2201');
  const vatRecoverableAccount = settings?.vat_recoverable_account_id ? accounts.find(a => a.id === settings.vat_recoverable_account_id) : accounts.find(a => a.code === '2202');

  let query = supabase.from('journal_entry_lines')
    .select('id, account_id, debit, credit, description, journal_entry:journal_entries!inner(id, entry_number, entry_date, description, reference_type, company_id, is_posted)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);

  const vatAccountIds = [vatPayableAccount?.id, vatRecoverableAccount?.id].filter(Boolean);
  if (vatAccountIds.length > 0) query = query.in('account_id', vatAccountIds);
  if (fiscalYearId) query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  else { if (startDate) query = query.gte('journal_entry.entry_date', startDate); if (endDate) query = query.lte('journal_entry.entry_date', endDate); }
  query = query.order('journal_entry(entry_date)', { ascending: true });

  const { data: lines, error: linesError } = await query;
  if (linesError) throw linesError;

  let vatPayableBalance = 0, vatRecoverableBalance = 0;
  const transactions: VATSettlementReport['transactions'] = [];

  (lines || []).forEach((line: any) => {
    const debit = Number(line.debit) || 0, credit = Number(line.credit) || 0;
    if (line.account_id === vatPayableAccount?.id) {
      vatPayableBalance += credit - debit;
      if (credit > 0) transactions.push({ date: line.journal_entry.entry_date, description: line.description || line.journal_entry.description, type: 'sales', taxAmount: credit, entryNumber: line.journal_entry.entry_number });
    } else if (line.account_id === vatRecoverableAccount?.id) {
      vatRecoverableBalance += debit - credit;
      if (debit > 0) transactions.push({ date: line.journal_entry.entry_date, description: line.description || line.journal_entry.description, type: 'purchases', taxAmount: debit, entryNumber: line.journal_entry.entry_number });
    }
  });

  const netVAT = vatPayableBalance - vatRecoverableBalance;
  let status: 'payable' | 'receivable' | 'settled' = netVAT > 0 ? 'payable' : netVAT < 0 ? 'receivable' : 'settled';

  return {
    vatPayable: { account: vatPayableAccount || null, balance: vatPayableBalance },
    vatRecoverable: { account: vatRecoverableAccount || null, balance: vatRecoverableBalance },
    netVAT, status, transactions,
  };
}
