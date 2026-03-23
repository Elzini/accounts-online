import { supabase } from '@/integrations/supabase/client';
import { AccountCategory, JournalEntryLine, VATSettlementReport } from './types';
import { fetchAccounts } from './accounts';
import { isAccountType, isCreditNormal, isBalanceSheetType } from '@/utils/accountTypes';

// Account Balances
export async function getAccountBalances(
  companyId: string,
  startDate?: string,
  endDate?: string,
  fiscalYearId?: string
): Promise<Array<{
  account: AccountCategory;
  debit_total: number;
  credit_total: number;
  balance: number;
}>> {
  const accounts = await fetchAccounts(companyId);
  
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date, fiscal_year_id)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (fiscalYearId) {
    query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  }
  // Date range filters within the fiscal year
  if (startDate) query = query.gte('journal_entry.entry_date', startDate);
  if (endDate) query = query.lte('journal_entry.entry_date', endDate);

  const { data: lines, error } = await query;
  if (error) throw error;

  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    balances.set(line.account_id, current);
  });

  return accounts.map(account => {
    const totals = balances.get(account.id) || { debit: 0, credit: 0 };
    let balance = totals.debit - totals.credit;
    if (['liabilities', 'equity', 'revenue'].includes(account.type)) {
      balance = totals.credit - totals.debit;
    }
    return { account, debit_total: totals.debit, credit_total: totals.credit, balance };
  }).filter(item => item.debit_total > 0 || item.credit_total > 0);
}

// Trial Balance
export async function getTrialBalance(
  companyId: string,
  startDate?: string,
  endDate?: string,
  fiscalYearId?: string
): Promise<{
  accounts: Array<{ account: AccountCategory; debit: number; credit: number; isParent?: boolean; level?: number }>;
  totalDebit: number;
  totalCredit: number;
}> {
  const accounts = await fetchAccounts(companyId);
  
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id, debit, credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date, fiscal_year_id)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (fiscalYearId) {
    query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  } else {
    if (startDate) query = query.gte('journal_entry.entry_date', startDate);
    if (endDate) query = query.lte('journal_entry.entry_date', endDate);
  }

  const { data: lines, error } = await query;
  if (error) throw error;

  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    balances.set(line.account_id, current);
  });

  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const childrenOf = (parentId: string) => accounts.filter(a => a.parent_id === parentId);

  const aggregateCache = new Map<string, { debit: number; credit: number }>();
  const getAggregated = (accountId: string): { debit: number; credit: number } => {
    if (aggregateCache.has(accountId)) return aggregateCache.get(accountId)!;
    const own = balances.get(accountId) || { debit: 0, credit: 0 };
    const children = childrenOf(accountId);
    let totalD = own.debit, totalC = own.credit;
    for (const child of children) {
      const childAgg = getAggregated(child.id);
      totalD += childAgg.debit;
      totalC += childAgg.credit;
    }
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
    if (hasChildren) {
      children.sort((a, b) => a.code.localeCompare(b.code)).forEach(child => addHierarchy(child, level + 1));
    }
  };
  rootAccounts.sort((a, b) => a.code.localeCompare(b.code)).forEach(a => addHierarchy(a, 0));

  const leafAccounts = trialAccounts.filter(a => !a.isParent);
  const totalDebit = leafAccounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = leafAccounts.reduce((sum, a) => sum + a.credit, 0);

  return { accounts: trialAccounts, totalDebit, totalCredit };
}

// Income Statement
export async function getIncomeStatement(companyId: string, startDate?: string, endDate?: string, fiscalYearId?: string): Promise<{
  revenue: Array<{ account: AccountCategory; amount: number }>;
  expenses: Array<{ account: AccountCategory; amount: number }>;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}> {
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id, debit, credit,
      journal_entry:journal_entries!inner(company_id, entry_date, is_posted, fiscal_year_id)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (fiscalYearId) {
    query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  } else {
    if (startDate) query = query.gte('journal_entry.entry_date', startDate);
    if (endDate) query = query.lte('journal_entry.entry_date', endDate);
  }

  const { data: lines, error } = await query;
  if (error) throw error;

  const accounts = await fetchAccounts(companyId);
  const revenueAccounts = accounts.filter(a => isAccountType(a.type, 'revenue'));
  const expenseAccounts = accounts.filter(a => isAccountType(a.type, 'expense'));

  const balances = new Map<string, number>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || 0;
    balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
  });

  const revenue = revenueAccounts.map(account => ({
    account,
    amount: balances.get(account.id) || 0,
  })).filter(r => r.amount !== 0);

  const expenses = expenseAccounts.map(account => ({
    account,
    amount: Math.abs(balances.get(account.id) || 0),
  })).filter(e => e.amount !== 0);

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
}

// General Ledger
export async function getGeneralLedger(
  companyId: string, 
  accountId: string,
  startDate?: string,
  endDate?: string,
  fiscalYearId?: string
): Promise<{
  account: AccountCategory;
  entries: Array<{
    id: string;
    date: string;
    entry_number: number;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    reference_type: string | null;
    sub_account_name?: string;
  }>;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  isParentAccount: boolean;
}> {
  const { data: account, error: accountError } = await supabase
    .from('account_categories')
    .select('*')
    .eq('id', accountId)
    .single();
  
  if (accountError) throw accountError;

  const allAccounts = await fetchAccounts(companyId);
  const accountMap = new Map(allAccounts.map(a => [a.id, a]));

  const getDescendantIds = (parentId: string): string[] => {
    const children = allAccounts.filter(a => a.parent_id === parentId);
    let ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      ids = ids.concat(getDescendantIds(child.id));
    }
    return ids;
  };

  const childIds = getDescendantIds(accountId);
  const isParentAccount = childIds.length > 0;
  const targetAccountIds = isParentAccount ? [accountId, ...childIds] : [accountId];

  let openingBalance = 0;
  if (startDate && fiscalYearId) {
    // When fiscal year is set, get opening from 'opening' entries in this fiscal year
    const { data: openingEntryLines } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id, debit, credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type, fiscal_year_id)
      `)
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .eq('journal_entry.fiscal_year_id', fiscalYearId)
      .eq('journal_entry.reference_type', 'opening');

    const { data: priorLines, error: priorError } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id, debit, credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date, fiscal_year_id)
      `)
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .eq('journal_entry.fiscal_year_id', fiscalYearId)
      .lt('journal_entry.entry_date', startDate);

    if (priorError) throw priorError;

    const isDebitNormal = ['asset', 'assets', 'expense', 'expenses'].includes(account.type);
    const openingLinesInPeriod = openingEntryLines || [];
    const allPriorLines = openingLinesInPeriod.length > 0 ? openingLinesInPeriod : (priorLines || []);
    allPriorLines.forEach((line: any) => {
      const d = Number(line.debit) || 0;
      const c = Number(line.credit) || 0;
      if (isDebitNormal) {
        openingBalance += d - c;
      } else {
        openingBalance += c - d;
      }
    });
  } else if (startDate && !fiscalYearId) {
    const { data: priorLines, error: priorError } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id, debit, credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
      `)
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .lt('journal_entry.entry_date', startDate);

    if (priorError) throw priorError;

    const { data: openingEntryLines } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id, debit, credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)
      `)
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .eq('journal_entry.reference_type', 'opening')
      .gte('journal_entry.entry_date', startDate);

    const isDebitNormal = ['asset', 'assets', 'expense', 'expenses'].includes(account.type);
    const openingLinesInPeriod = openingEntryLines || [];
    const allPriorLines = openingLinesInPeriod.length > 0 ? openingLinesInPeriod : (priorLines || []);
    allPriorLines.forEach((line: any) => {
      const d = Number(line.debit) || 0;
      const c = Number(line.credit) || 0;
      if (isDebitNormal) {
        openingBalance += d - c;
      } else {
        openingBalance += c - d;
      }
    });
  }

  let query = supabase
    .from('journal_entry_lines')
    .select(`
      id, account_id, debit, credit, description,
      journal_entry:journal_entries!inner(
        id, entry_number, entry_date, description, reference_type, company_id, is_posted, fiscal_year_id
      )
    `)
    .in('account_id', targetAccountIds)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .order('journal_entry(entry_date)', { ascending: true })
    .order('journal_entry(entry_number)', { ascending: true });

  if (fiscalYearId) {
    query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  }
  if (startDate) query = query.gte('journal_entry.entry_date', startDate);
  if (endDate) query = query.lte('journal_entry.entry_date', endDate);

  const { data: lines, error: linesError } = await query;
  if (linesError) throw linesError;

  let runningBalance = openingBalance;
  const isDebitNormal = ['asset', 'assets', 'expense', 'expenses'].includes(account.type);

  const entries = (lines || []).map((line: any) => {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;
    
    if (isDebitNormal) {
      runningBalance += debit - credit;
    } else {
      runningBalance += credit - debit;
    }

    const subAccount = isParentAccount && line.account_id !== accountId
      ? accountMap.get(line.account_id)
      : null;

    return {
      id: line.id,
      date: line.journal_entry.entry_date,
      entry_number: line.journal_entry.entry_number,
      description: line.journal_entry.description || line.description,
      debit,
      credit,
      balance: runningBalance,
      reference_type: line.journal_entry.reference_type,
      sub_account_name: subAccount ? `${subAccount.code} - ${subAccount.name}` : undefined,
    };
  });

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

  return {
    account: account as AccountCategory,
    entries,
    openingBalance,
    totalDebit,
    totalCredit,
    closingBalance: runningBalance,
    isParentAccount,
  };
}

// Balance Sheet
export async function getBalanceSheet(
  companyId: string,
  startDate?: string,
  endDate?: string,
  fiscalYearId?: string
): Promise<{
  currentAssets: Array<{ account: AccountCategory; balance: number }>;
  fixedAssets: Array<{ account: AccountCategory; balance: number }>;
  currentLiabilities: Array<{ account: AccountCategory; balance: number }>;
  longTermLiabilities: Array<{ account: AccountCategory; balance: number }>;
  equity: Array<{ account: AccountCategory; balance: number }>;
  totalCurrentAssets: number;
  totalFixedAssets: number;
  totalAssets: number;
  totalCurrentLiabilities: number;
  totalLongTermLiabilities: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
}> {
  const accounts = await fetchAccounts(companyId);
  
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id, debit, credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date, fiscal_year_id)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (fiscalYearId) {
    query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  } else {
    if (startDate) query = query.gte('journal_entry.entry_date', startDate);
    if (endDate) query = query.lte('journal_entry.entry_date', endDate);
  }

  const { data: lines, error } = await query;
  if (error) throw error;

  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    balances.set(line.account_id, current);
  });

  const calculateBalance = (account: AccountCategory) => {
    const totals = balances.get(account.id) || { debit: 0, credit: 0 };
    if (isCreditNormal(account.type)) {
      return totals.credit - totals.debit;
    }
    return totals.debit - totals.credit;
  };

  const assetAccounts = accounts.filter(a => isAccountType(a.type, 'asset'));
  const liabilityAccounts = accounts.filter(a => isAccountType(a.type, 'liability'));
  const equityAccounts = accounts.filter(a => isAccountType(a.type, 'equity'));
  const revenueAccounts = accounts.filter(a => isAccountType(a.type, 'revenue'));
  const expenseAccounts = accounts.filter(a => isAccountType(a.type, 'expense'));

  const currentAssetCodes = ['11', '12', '13'];
  const isCurrentAsset = (code: string) => currentAssetCodes.some(c => code.startsWith(c));

  const currentAssets = assetAccounts
    .filter(a => isCurrentAsset(a.code))
    .map(account => ({ account, balance: calculateBalance(account) }))
    .filter(a => a.balance !== 0);

  const fixedAssets = assetAccounts
    .filter(a => !isCurrentAsset(a.code))
    .map(account => ({ account, balance: calculateBalance(account) }))
    .filter(a => a.balance !== 0);

  const currentLiabilityCodes = ['21', '22'];
  const isCurrentLiability = (code: string) => currentLiabilityCodes.some(c => code.startsWith(c));

  const currentLiabilities = liabilityAccounts
    .filter(a => isCurrentLiability(a.code))
    .map(account => ({ account, balance: calculateBalance(account) }))
    .filter(l => l.balance !== 0);

  const longTermLiabilities = liabilityAccounts
    .filter(a => !isCurrentLiability(a.code))
    .map(account => ({ account, balance: calculateBalance(account) }))
    .filter(l => l.balance !== 0);

  const equity = equityAccounts.map(account => ({
    account,
    balance: calculateBalance(account),
  })).filter(e => e.balance !== 0);

  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + calculateBalance(a), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Math.abs(calculateBalance(a)), 0);
  const retainedEarnings = totalRevenue - totalExpenses;

  const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.balance, 0);
  const totalFixedAssets = fixedAssets.reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  
  const totalCurrentLiabilities = currentLiabilities.reduce((sum, l) => sum + l.balance, 0);
  const totalLongTermLiabilities = longTermLiabilities.reduce((sum, l) => sum + l.balance, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
  const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0) + retainedEarnings;

  return {
    currentAssets, fixedAssets, currentLiabilities, longTermLiabilities, equity,
    totalCurrentAssets, totalFixedAssets, totalAssets,
    totalCurrentLiabilities, totalLongTermLiabilities, totalLiabilities,
    totalEquity, retainedEarnings,
  };
}

// Vouchers Report
export async function getVouchersReport(
  companyId: string,
  startDate?: string,
  endDate?: string,
  voucherType?: 'receipt' | 'payment',
  fiscalYearId?: string
): Promise<Array<{
  id: string;
  voucher_number: number;
  voucher_date: string;
  voucher_type: string;
  description: string;
  amount: number;
  payment_method: string | null;
  related_to: string | null;
}>> {
  let query = (supabase as any)
    .from('vouchers')
    .select('*')
    .eq('company_id', companyId)
    .order('voucher_date', { ascending: false });

  if (fiscalYearId) {
    query = query.eq('fiscal_year_id', fiscalYearId);
  } else {
    if (startDate) query = query.gte('voucher_date', startDate);
    if (endDate) query = query.lte('voucher_date', endDate);
  }
  if (voucherType) {
    query = query.eq('voucher_type', voucherType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Journal Entries Report
export async function getJournalEntriesReport(
  companyId: string,
  startDate?: string,
  endDate?: string,
  referenceType?: string,
  fiscalYearId?: string
): Promise<Array<{
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  reference_type: string | null;
  total_debit: number;
  total_credit: number;
  lines: JournalEntryLine[];
}>> {
  let query = supabase
    .from('journal_entries')
    .select(`
      *,
      lines:journal_entry_lines(
        *,
        account:account_categories(*)
      )
    `)
    .eq('company_id', companyId)
    .eq('is_posted', true)
    .order('entry_date', { ascending: false });

  if (fiscalYearId) {
    query = query.eq('fiscal_year_id', fiscalYearId);
  } else {
    if (startDate) query = query.gte('entry_date', startDate);
    if (endDate) query = query.lte('entry_date', endDate);
  }
  if (referenceType) {
    query = query.eq('reference_type', referenceType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as any;
}

// Comprehensive Trial Balance
export async function getComprehensiveTrialBalance(
  companyId: string,
  startDate?: string,
  endDate?: string,
  fiscalYearId?: string
): Promise<{
  accounts: Array<{ 
    account: AccountCategory; 
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
    isParent: boolean;
    level: number;
  }>;
  totals: {
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
  };
}> {
  const accounts = await fetchAccounts(companyId);

  let fyStartDate: string | undefined;
  let effectiveStartDate: string | undefined;
  let effectiveEndDate: string | undefined;

  if (fiscalYearId) {
    const { data: selectedFY } = await supabase
      .from('fiscal_years')
      .select('start_date, end_date')
      .eq('id', fiscalYearId)
      .single();
    fyStartDate = selectedFY?.start_date;
    effectiveStartDate = startDate || fyStartDate;
    effectiveEndDate = endDate || selectedFY?.end_date;
  } else {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years')
      .select('start_date, end_date')
      .eq('company_id', companyId)
      .eq('is_current', true)
      .single();
    fyStartDate = fiscalYear?.start_date;
    effectiveStartDate = startDate || fyStartDate;
    effectiveEndDate = endDate || fiscalYear?.end_date;
  }

  // 1) Opening balances
  const openingBalances = new Map<string, { debit: number; credit: number }>();
  let rawOpeningDebitAll = 0, rawOpeningCreditAll = 0;

  if (effectiveStartDate) {
    let openingEntriesQuery = supabase
      .from('journal_entry_lines')
      .select(`
        account_id, debit, credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type, fiscal_year_id)
      `)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .eq('journal_entry.reference_type', 'opening');

    if (fiscalYearId) {
      openingEntriesQuery = openingEntriesQuery.eq('journal_entry.fiscal_year_id', fiscalYearId);
    } else {
      openingEntriesQuery = openingEntriesQuery.gte('journal_entry.entry_date', effectiveStartDate);
      if (effectiveEndDate) {
        openingEntriesQuery = openingEntriesQuery.lte('journal_entry.entry_date', effectiveEndDate);
      }
    }

    const { data: openingEntryLines } = await openingEntriesQuery;
    const openingLinesInPeriod = openingEntryLines || [];
    const hasOpeningEntryInRange = openingLinesInPeriod.length > 0;

    if (hasOpeningEntryInRange) {
      const accountTypeMap = new Map<string, string>();
      accounts.forEach(a => accountTypeMap.set(a.id, a.type));

      openingLinesInPeriod.forEach((line: any) => {
        const d = Number(line.debit) || 0;
        const c = Number(line.credit) || 0;
        rawOpeningDebitAll += d;
        rawOpeningCreditAll += c;

        const accType = accountTypeMap.get(line.account_id);
        const shouldIncludeInOpening = !!accType && isBalanceSheetType(accType);
        if (!shouldIncludeInOpening) return;

        const current = openingBalances.get(line.account_id) || { debit: 0, credit: 0 };
        current.debit += d;
        current.credit += c;
        openingBalances.set(line.account_id, current);
      });
    } else if (!fiscalYearId) {
      const { data: openingLines } = await supabase
        .from('journal_entry_lines')
        .select(`
          account_id, debit, credit,
          journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
        `)
        .eq('journal_entry.company_id', companyId)
        .eq('journal_entry.is_posted', true)
        .lt('journal_entry.entry_date', effectiveStartDate);

      (openingLines || []).forEach((line: any) => {
        const d = Number(line.debit) || 0;
        const c = Number(line.credit) || 0;
        rawOpeningDebitAll += d;
        rawOpeningCreditAll += c;
        const current = openingBalances.get(line.account_id) || { debit: 0, credit: 0 };
        current.debit += d;
        current.credit += c;
        openingBalances.set(line.account_id, current);
      });
    }
  }

  // 2) Period movement
  let periodQuery = supabase
    .from('journal_entry_lines')
    .select(`
      account_id, debit, credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type, fiscal_year_id)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .neq('journal_entry.reference_type', 'opening');

  if (fiscalYearId) {
    periodQuery = periodQuery.eq('journal_entry.fiscal_year_id', fiscalYearId);
  } else {
    if (effectiveStartDate) periodQuery = periodQuery.gte('journal_entry.entry_date', effectiveStartDate);
    if (effectiveEndDate) periodQuery = periodQuery.lte('journal_entry.entry_date', effectiveEndDate);
  }

  const { data: periodLines, error } = await periodQuery;
  if (error) throw error;

  const periodBalances = new Map<string, { debit: number; credit: number }>();
  (periodLines || []).forEach((line: any) => {
    const current = periodBalances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    periodBalances.set(line.account_id, current);
  });

  // Build per-account balances
  const leafOpening = new Map<string, { od: number; oc: number }>();
  const leafPeriod = new Map<string, { pd: number; pc: number }>();

  accounts.forEach(account => {
    const ob = openingBalances.get(account.id);
    if (ob && (ob.debit > 0 || ob.credit > 0)) {
      leafOpening.set(account.id, { od: ob.debit, oc: ob.credit });
    }
    const pb = periodBalances.get(account.id);
    if (pb && (pb.debit > 0 || pb.credit > 0)) {
      leafPeriod.set(account.id, { pd: pb.debit, pc: pb.credit });
    }
  });

  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const childrenOf = (parentId: string) => accounts.filter(a => a.parent_id === parentId);

  const aggCache = new Map<string, { od: number; oc: number; pd: number; pc: number }>();
  const getAggregated = (accountId: string): { od: number; oc: number; pd: number; pc: number } => {
    if (aggCache.has(accountId)) return aggCache.get(accountId)!;
    const ownO = leafOpening.get(accountId) || { od: 0, oc: 0 };
    const ownP = leafPeriod.get(accountId) || { pd: 0, pc: 0 };
    const children = childrenOf(accountId);
    let tOD = ownO.od, tOC = ownO.oc, tPD = ownP.pd, tPC = ownP.pc;
    for (const child of children) {
      const c = getAggregated(child.id);
      tOD += c.od; tOC += c.oc; tPD += c.pd; tPC += c.pc;
    }
    const result = { od: tOD, oc: tOC, pd: tPD, pc: tPC };
    aggCache.set(accountId, result);
    return result;
  };
  accounts.forEach(a => getAggregated(a.id));

  const trialAccounts: Array<{
    account: AccountCategory;
    openingDebit: number; openingCredit: number;
    periodDebit: number; periodCredit: number;
    closingDebit: number; closingCredit: number;
    isParent: boolean; level: number;
  }> = [];

  const rootAccounts = accounts.filter(a => !a.parent_id || !accountMap.has(a.parent_id));

  const addAccountHierarchy = (account: AccountCategory, level: number) => {
    const children = childrenOf(account.id);
    const hasChildren = children.length > 0;
    const agg = getAggregated(account.id);
    if (agg.od === 0 && agg.oc === 0 && agg.pd === 0 && agg.pc === 0) return;

    const openingNet = agg.od - agg.oc;
    const closingNet = (agg.od + agg.pd) - (agg.oc + agg.pc);

    trialAccounts.push({
      account,
      openingDebit: openingNet > 0 ? openingNet : 0,
      openingCredit: openingNet < 0 ? Math.abs(openingNet) : 0,
      periodDebit: agg.pd,
      periodCredit: agg.pc,
      closingDebit: closingNet > 0 ? closingNet : 0,
      closingCredit: closingNet < 0 ? Math.abs(closingNet) : 0,
      isParent: hasChildren,
      level,
    });

    if (hasChildren) {
      children.sort((a, b) => a.code.localeCompare(b.code)).forEach(child => addAccountHierarchy(child, level + 1));
    }
  };

  rootAccounts.sort((a, b) => a.code.localeCompare(b.code)).forEach(account => addAccountHierarchy(account, 0));

  let rawPeriodDebit = 0, rawPeriodCredit = 0;
  periodBalances.forEach((val) => {
    rawPeriodDebit += val.debit;
    rawPeriodCredit += val.credit;
  });

  const closingAccountIds = new Set<string>([
    ...Array.from(openingBalances.keys()),
    ...Array.from(periodBalances.keys()),
  ]);

  let netClosingDebit = 0;
  let netClosingCredit = 0;
  closingAccountIds.forEach((accountId) => {
    const opening = openingBalances.get(accountId) || { debit: 0, credit: 0 };
    const period = periodBalances.get(accountId) || { debit: 0, credit: 0 };
    const net = (opening.debit + period.debit) - (opening.credit + period.credit);
    if (net > 0) netClosingDebit += net;
    else if (net < 0) netClosingCredit += Math.abs(net);
  });

  const totals = {
    openingDebit: rawOpeningDebitAll,
    openingCredit: rawOpeningCreditAll,
    periodDebit: rawPeriodDebit,
    periodCredit: rawPeriodCredit,
    closingDebit: netClosingDebit,
    closingCredit: netClosingCredit,
  };

  return { accounts: trialAccounts, totals };
}

// VAT Settlement Report
export async function getVATSettlementReport(
  companyId: string,
  startDate?: string,
  endDate?: string,
  fiscalYearId?: string
): Promise<VATSettlementReport> {
  const { data: settings, error: settingsError } = await supabase
    .from('company_accounting_settings')
    .select('vat_payable_account_id, vat_recoverable_account_id')
    .eq('company_id', companyId)
    .maybeSingle();

  if (settingsError) throw settingsError;

  const accounts = await fetchAccounts(companyId);
  
  let vatPayableAccount = settings?.vat_payable_account_id 
    ? accounts.find(a => a.id === settings.vat_payable_account_id)
    : accounts.find(a => a.code === '2201');
  
  let vatRecoverableAccount = settings?.vat_recoverable_account_id
    ? accounts.find(a => a.id === settings.vat_recoverable_account_id)
    : accounts.find(a => a.code === '2202');

  let query = supabase
    .from('journal_entry_lines')
    .select(`
      id, account_id, debit, credit, description,
      journal_entry:journal_entries!inner(
        id, entry_number, entry_date, description, reference_type, company_id, is_posted
      )
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  const vatAccountIds = [vatPayableAccount?.id, vatRecoverableAccount?.id].filter(Boolean);
  if (vatAccountIds.length > 0) {
    query = query.in('account_id', vatAccountIds);
  }

  if (fiscalYearId) {
    query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  } else {
    if (startDate) query = query.gte('journal_entry.entry_date', startDate);
    if (endDate) query = query.lte('journal_entry.entry_date', endDate);
  }

  query = query.order('journal_entry(entry_date)', { ascending: true });

  const { data: lines, error: linesError } = await query;
  if (linesError) throw linesError;

  let vatPayableBalance = 0;
  let vatRecoverableBalance = 0;
  const transactions: VATSettlementReport['transactions'] = [];

  (lines || []).forEach((line: any) => {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;
    
    if (line.account_id === vatPayableAccount?.id) {
      vatPayableBalance += credit - debit;
      if (credit > 0) {
        transactions.push({
          date: line.journal_entry.entry_date,
          description: line.description || line.journal_entry.description,
          type: 'sales',
          taxAmount: credit,
          entryNumber: line.journal_entry.entry_number,
        });
      }
    } else if (line.account_id === vatRecoverableAccount?.id) {
      vatRecoverableBalance += debit - credit;
      if (debit > 0) {
        transactions.push({
          date: line.journal_entry.entry_date,
          description: line.description || line.journal_entry.description,
          type: 'purchases',
          taxAmount: debit,
          entryNumber: line.journal_entry.entry_number,
        });
      }
    }
  });

  const netVAT = vatPayableBalance - vatRecoverableBalance;
  let status: 'payable' | 'receivable' | 'settled' = 'settled';
  if (netVAT > 0) status = 'payable';
  else if (netVAT < 0) status = 'receivable';

  return {
    vatPayable: { account: vatPayableAccount || null, balance: vatPayableBalance },
    vatRecoverable: { account: vatRecoverableAccount || null, balance: vatRecoverableBalance },
    netVAT,
    status,
    transactions,
  };
}
