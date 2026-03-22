import { supabase } from '@/integrations/supabase/client';

// Types
export interface TaxSettings {
  id: string;
  company_id: string;
  tax_name: string;
  tax_rate: number;
  is_active: boolean;
  apply_to_sales: boolean;
  apply_to_purchases: boolean;
  tax_number: string | null;
  company_name_ar: string | null;
  national_address: string | null;
  commercial_register: string | null;
  city: string | null;
  postal_code: string | null;
  building_number: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountType = 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';
export type ReferenceType = 'sale' | 'purchase' | 'manual' | 'adjustment' | 'opening';

export interface AccountCategory {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: AccountType;
  parent_id: string | null;
  is_system: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  reference_type: ReferenceType | null;
  reference_id: string | null;
  total_debit: number;
  total_credit: number;
  is_posted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project_id?: string | null;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  description: string | null;
  debit: number;
  credit: number;
  created_at: string;
  account?: AccountCategory;
}

// Tax Settings
export async function fetchTaxSettings(companyId: string): Promise<TaxSettings | null> {
  const { data, error } = await supabase
    .from('tax_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function upsertTaxSettings(companyId: string, settings: Partial<TaxSettings>): Promise<TaxSettings> {
  const { data, error } = await supabase
    .from('tax_settings')
    .upsert({
      company_id: companyId,
      ...settings,
    }, { onConflict: 'company_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Account Categories (Chart of Accounts)
export async function fetchAccounts(companyId: string): Promise<AccountCategory[]> {
  // Fetch all accounts (may exceed default 1000 limit)
  const allData: AccountCategory[] = [];
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('account_categories')
      .select('*')
      .eq('company_id', companyId)
      .order('code', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...(data as AccountCategory[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  return allData;
}

export async function createDefaultAccounts(companyId: string): Promise<void> {
  const { error } = await supabase.rpc('create_default_accounts', { p_company_id: companyId });
  if (error) throw error;
}

export async function addAccount(account: Omit<AccountCategory, 'id' | 'created_at' | 'updated_at'>): Promise<AccountCategory> {
  const { data, error } = await supabase
    .from('account_categories')
    .insert(account)
    .select()
    .single();
  
  if (error) throw error;
  return data as AccountCategory;
}

export async function updateAccount(id: string, updates: Partial<AccountCategory>): Promise<AccountCategory> {
  const { data, error } = await supabase
    .from('account_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as AccountCategory;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('account_categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Journal Entries
export async function fetchJournalEntries(companyId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('company_id', companyId)
    .order('entry_number', { ascending: false });
  
  if (error) throw error;
  return (data || []) as JournalEntry[];
}

export async function fetchJournalEntryWithLines(entryId: string): Promise<JournalEntry | null> {
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single();
  
  if (entryError) throw entryError;
  if (!entry) return null;

  const { data: lines, error: linesError } = await supabase
    .from('journal_entry_lines')
    .select(`
      *,
      account:account_categories(*)
    `)
    .eq('journal_entry_id', entryId)
    .order('created_at', { ascending: true });
  
  if (linesError) throw linesError;

  return {
    ...(entry as JournalEntry),
    lines: (lines || []) as JournalEntryLine[],
  };
}

export async function createJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>,
  lines: Array<{ account_id: string; description?: string; debit: number; credit: number; cost_center_id?: string | null }>
): Promise<JournalEntry> {
  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

  // Insert entry
  const { data: newEntry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      ...entry,
      total_debit: totalDebit,
      total_credit: totalCredit,
    })
    .select()
    .single();
  
  if (entryError) throw entryError;

  // Insert lines
  const linesWithEntryId = lines.map(line => ({
    journal_entry_id: newEntry.id,
    account_id: line.account_id,
    description: line.description || null,
    debit: line.debit || 0,
    credit: line.credit || 0,
    cost_center_id: line.cost_center_id || null,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(linesWithEntryId);
  
  if (linesError) throw linesError;

  return newEntry as JournalEntry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Update Journal Entry
export async function updateJournalEntry(
  entryId: string,
  entry: Partial<Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>>,
  lines: Array<{ id?: string; account_id: string; description?: string; debit: number; credit: number; cost_center_id?: string | null }>
): Promise<JournalEntry> {
  // Update the entry
  const { data: updatedEntry, error: entryError } = await supabase
    .from('journal_entries')
    .update({
      entry_date: entry.entry_date,
      description: entry.description,
      total_debit: entry.total_debit,
      total_credit: entry.total_credit,
    })
    .eq('id', entryId)
    .select()
    .single();
  
  if (entryError) throw entryError;

  // Delete existing lines
  const { error: deleteError } = await supabase
    .from('journal_entry_lines')
    .delete()
    .eq('journal_entry_id', entryId);
  
  if (deleteError) throw deleteError;

  // Insert new lines
  const linesWithEntryId = lines.map(line => ({
    journal_entry_id: entryId,
    account_id: line.account_id,
    description: line.description || null,
    debit: line.debit || 0,
    credit: line.credit || 0,
    cost_center_id: line.cost_center_id || null,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(linesWithEntryId);
  
  if (linesError) throw linesError;

  return updatedEntry as JournalEntry;
}

// Reports
export async function getAccountBalances(
  companyId: string,
  startDate?: string,
  endDate?: string
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
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (startDate) {
    query = query.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('journal_entry.entry_date', endDate);
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

  return accounts.map(account => {
    const totals = balances.get(account.id) || { debit: 0, credit: 0 };
    let balance = totals.debit - totals.credit;
    
    // For liabilities, equity, and revenue, credit increases the balance
    if (['liabilities', 'equity', 'revenue'].includes(account.type)) {
      balance = totals.credit - totals.debit;
    }
    
    return {
      account,
      debit_total: totals.debit,
      credit_total: totals.credit,
      balance,
    };
  }).filter(item => item.debit_total > 0 || item.credit_total > 0);
}

export async function getTrialBalance(
  companyId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  accounts: Array<{ account: AccountCategory; debit: number; credit: number; isParent?: boolean; level?: number }>;
  totalDebit: number;
  totalCredit: number;
}> {
  const accounts = await fetchAccounts(companyId);
  
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (startDate) {
    query = query.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('journal_entry.entry_date', endDate);
  }

  const { data: lines, error } = await query;
  
  if (error) throw error;

  // Aggregate totals per account
  const balances = new Map<string, { debit: number; credit: number }>();
  
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    balances.set(line.account_id, current);
  });

  // Build hierarchical trial balance
  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const childrenOf = (parentId: string) => accounts.filter(a => a.parent_id === parentId);

  // Recursive bottom-up aggregation
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

export async function getIncomeStatement(companyId: string, startDate?: string, endDate?: string): Promise<{
  revenue: Array<{ account: AccountCategory; amount: number }>;
  expenses: Array<{ account: AccountCategory; amount: number }>;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}> {
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, entry_date, is_posted)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (startDate) {
    query = query.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('journal_entry.entry_date', endDate);
  }

  const { data: lines, error } = await query;
  if (error) throw error;

  const accounts = await fetchAccounts(companyId);
  const revenueAccounts = accounts.filter(a => a.type === 'revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'expenses');

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

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  };
}

// General Ledger - حركة حساب معين (يدعم تجميع الفروع)
export async function getGeneralLedger(
  companyId: string, 
  accountId: string,
  startDate?: string,
  endDate?: string
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
  // Get account details
  const { data: account, error: accountError } = await supabase
    .from('account_categories')
    .select('*')
    .eq('id', accountId)
    .single();
  
  if (accountError) throw accountError;

  // Get all accounts to check for children
  const allAccounts = await fetchAccounts(companyId);
  const accountMap = new Map(allAccounts.map(a => [a.id, a]));

  // Collect all descendant account IDs (recursive)
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

  // Calculate opening balance (entries before startDate)
  let openingBalance = 0;
  if (startDate) {
    // جلب الأرصدة قبل بداية الفترة
    const { data: priorLines, error: priorError } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id,
        debit,
        credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
      `)
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .lt('journal_entry.entry_date', startDate);

    if (priorError) throw priorError;

    // جلب قيود الافتتاح المرحّلة ضمن الفترة
    const { data: openingEntryLines } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id,
        debit,
        credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)
      `)
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .eq('journal_entry.reference_type', 'opening')
      .gte('journal_entry.entry_date', startDate);

    const isDebitNormal = ['asset', 'assets', 'expense', 'expenses'].includes(account.type);
    // إذا وُجد قيد افتتاحي داخل الفترة نستخدمه حصراً للافتتاح (لمنع التكرار)
    const openingLinesInPeriod = openingEntryLines || [];
    const allPriorLines = openingLinesInPeriod.length > 0
      ? openingLinesInPeriod
      : (priorLines || []);
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

  // Build query for journal entry lines in the period
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      id,
      account_id,
      debit,
      credit,
      description,
      journal_entry:journal_entries!inner(
        id,
        entry_number,
        entry_date,
        description,
        reference_type,
        company_id,
        is_posted
      )
    `)
    .in('account_id', targetAccountIds)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .order('journal_entry(entry_date)', { ascending: true })
    .order('journal_entry(entry_number)', { ascending: true });

  if (startDate) {
    query = query.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('journal_entry.entry_date', endDate);
  }

  const { data: lines, error: linesError } = await query;
  if (linesError) throw linesError;

  // Calculate running balance
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

    // Get sub-account name if this is a parent account query
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

// Balance Sheet - الميزانية العمومية
export async function getBalanceSheet(
  companyId: string,
  startDate?: string,
  endDate?: string
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
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (startDate) {
    query = query.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('journal_entry.entry_date', endDate);
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
    if (['liabilities', 'equity', 'revenue'].includes(account.type)) {
      return totals.credit - totals.debit;
    }
    return totals.debit - totals.credit;
  };

  const assetAccounts = accounts.filter(a => a.type === 'assets');
  const liabilityAccounts = accounts.filter(a => a.type === 'liabilities');
  const equityAccounts = accounts.filter(a => a.type === 'equity');
  const revenueAccounts = accounts.filter(a => a.type === 'revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'expenses');

  // تصنيف الأصول: متداولة (11, 12, 13) وثابتة (14, 15, 16, 17)
  // Current Assets: النقد (11), الذمم المدينة (12), المخزون (13)
  // Fixed Assets: الأصول الثابتة (14), الاستثمارات (15), الأصول غير الملموسة (16)
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

  // تصنيف الخصوم: متداولة (21, 22) وطويلة الأجل (23, 24)
  // Current Liabilities: الدائنون (21), المصروفات المستحقة (22)
  // Long-term Liabilities: القروض طويلة الأجل (23)
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

  // Calculate retained earnings (net income)
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
    currentAssets,
    fixedAssets,
    currentLiabilities,
    longTermLiabilities,
    equity,
    totalCurrentAssets,
    totalFixedAssets,
    totalAssets,
    totalCurrentLiabilities,
    totalLongTermLiabilities,
    totalLiabilities,
    totalEquity,
    retainedEarnings,
  };
}

// Vouchers Report - كشف السندات
export async function getVouchersReport(
  companyId: string,
  startDate?: string,
  endDate?: string,
  voucherType?: 'receipt' | 'payment'
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
  let query = supabase
    .from('vouchers')
    .select('*')
    .eq('company_id', companyId)
    .order('voucher_date', { ascending: false });

  if (startDate) {
    query = query.gte('voucher_date', startDate);
  }
  if (endDate) {
    query = query.lte('voucher_date', endDate);
  }
  if (voucherType) {
    query = query.eq('voucher_type', voucherType);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

// Journal Entry Details Report - كشف القيود
export async function getJournalEntriesReport(
  companyId: string,
  startDate?: string,
  endDate?: string,
  referenceType?: string
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

  if (startDate) {
    query = query.gte('entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('entry_date', endDate);
  }
  if (referenceType) {
    query = query.eq('reference_type', referenceType);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as any;
}

// Comprehensive Trial Balance - ميزان المراجعة الشامل
export async function getComprehensiveTrialBalance(
  companyId: string,
  startDate?: string,
  endDate?: string
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

  // Get current fiscal year start date for opening balance calculation
  const { data: fiscalYear } = await supabase
    .from('fiscal_years')
    .select('start_date, end_date')
    .eq('company_id', companyId)
    .eq('is_current', true)
    .single();

  const fyStartDate = fiscalYear?.start_date;
  const effectiveStartDate = startDate || fyStartDate;
  const effectiveEndDate = endDate || fiscalYear?.end_date;

  // 1) Fetch OPENING balances
  // قاعدة مهمة: إذا وُجد قيد افتتاحي داخل الفترة المختارة نستخدمه كمصدر وحيد للافتتاح
  // لمنع تكرار ترحيل أرصدة السنوات السابقة مرتين.
  const openingBalances = new Map<string, { debit: number; credit: number }>();
  // Track raw totals from ALL accounts (including revenue/expense) for balanced grand totals
  let rawOpeningDebitAll = 0, rawOpeningCreditAll = 0;

  if (effectiveStartDate) {
    const { data: openingLines } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id, debit, credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
      `)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .lt('journal_entry.entry_date', effectiveStartDate);

    // جلب قيود الافتتاح المرحّلة ضمن الفترة (من تاريخ البداية وحتى النهاية إن وُجدت)
    let openingEntriesQuery = supabase
      .from('journal_entry_lines')
      .select(`
        account_id, debit, credit,
        journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)
      `)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .eq('journal_entry.reference_type', 'opening')
      .gte('journal_entry.entry_date', effectiveStartDate);

    if (effectiveEndDate) {
      openingEntriesQuery = openingEntriesQuery.lte('journal_entry.entry_date', effectiveEndDate);
    }

    const { data: openingEntryLines } = await openingEntriesQuery;

    // استبعاد حسابات الإيرادات والمصروفات من الأرصدة الافتتاحية (حسابات فترة)
    const balanceSheetTypes = new Set(['asset', 'assets', 'liability', 'liabilities', 'equity']);
    const accountTypeMap = new Map<string, string>();
    accounts.forEach(a => accountTypeMap.set(a.id, a.type));

    const openingLinesInPeriod = openingEntryLines || [];
    const openingSourceLines = openingLinesInPeriod.length > 0
      ? openingLinesInPeriod
      : (openingLines || []);

    const allOpeningLines = openingSourceLines;
    allOpeningLines.forEach((line: any) => {
      const d = Number(line.debit) || 0;
      const c = Number(line.credit) || 0;
      // Accumulate raw totals from ALL accounts for balanced grand totals
      rawOpeningDebitAll += d;
      rawOpeningCreditAll += c;

      const accType = accountTypeMap.get(line.account_id);
      if (!accType || !balanceSheetTypes.has(accType)) return;
      const current = openingBalances.get(line.account_id) || { debit: 0, credit: 0 };
      current.debit += d;
      current.credit += c;
      openingBalances.set(line.account_id, current);
    });
  }

  // 2) Fetch PERIOD movement: entries within the date range (excluding opening entries)
  let periodQuery = supabase
    .from('journal_entry_lines')
    .select(`
      account_id, debit, credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .neq('journal_entry.reference_type', 'opening');

  if (effectiveStartDate) {
    periodQuery = periodQuery.gte('journal_entry.entry_date', effectiveStartDate);
  }
  if (effectiveEndDate) {
    periodQuery = periodQuery.lte('journal_entry.entry_date', effectiveEndDate);
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

  // Build per-account balances (include ALL accounts that have direct journal entries)
  const leafOpening = new Map<string, { od: number; oc: number }>();
  const leafPeriod = new Map<string, { pd: number; pc: number }>();

  // Include every account that has data (whether leaf or parent with direct entries)
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

  // Build parent-children map
  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const childrenOf = (parentId: string) => accounts.filter(a => a.parent_id === parentId);

  // Recursive aggregation
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

  // Build hierarchical list
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

    // Skip accounts with no activity at all
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
      children
        .sort((a, b) => a.code.localeCompare(b.code))
        .forEach(child => addAccountHierarchy(child, level + 1));
    }
  };

  rootAccounts
    .sort((a, b) => a.code.localeCompare(b.code))
    .forEach(account => addAccountHierarchy(account, 0));

  // Calculate totals from RAW journal entry data (not netted display values)
  // This ensures totals are always balanced regardless of parent/child hierarchy
  // Use raw totals from ALL accounts (including revenue/expense) to ensure balance
  let rawOpeningDebit = rawOpeningDebitAll;
  let rawOpeningCredit = rawOpeningCreditAll;
  let rawPeriodDebit = 0, rawPeriodCredit = 0;

  periodBalances.forEach((val) => {
    rawPeriodDebit += val.debit;
    rawPeriodCredit += val.credit;
  });

  // Closing totals must be NETTED per account (not raw debit+credit sums)
  // so "رصيد آخر المدة" differs from movement and reflects true ending balances.
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
    openingDebit: rawOpeningDebit,
    openingCredit: rawOpeningCredit,
    periodDebit: rawPeriodDebit,
    periodCredit: rawPeriodCredit,
    closingDebit: netClosingDebit,
    closingCredit: netClosingCredit,
  };

  return { accounts: trialAccounts, totals };
}

// VAT Settlement Report - تقرير تسوية ضريبة القيمة المضافة
export interface VATSettlementReport {
  vatPayable: {
    account: AccountCategory | null;
    balance: number; // ضريبة المخرجات - على المبيعات
  };
  vatRecoverable: {
    account: AccountCategory | null;
    balance: number; // ضريبة المدخلات - على المشتريات
  };
  netVAT: number; // الفرق - المبلغ المستحق للهيئة أو لصالح الشركة
  status: 'payable' | 'receivable' | 'settled'; // حالة التسوية
  transactions: Array<{
    date: string;
    description: string;
    type: 'sales' | 'purchases';
    taxAmount: number;
    entryNumber: number;
  }>;
}

export async function getVATSettlementReport(
  companyId: string,
  startDate?: string,
  endDate?: string
): Promise<VATSettlementReport> {
  // Get company accounting settings to find VAT accounts
  const { data: settings, error: settingsError } = await supabase
    .from('company_accounting_settings')
    .select('vat_payable_account_id, vat_recoverable_account_id')
    .eq('company_id', companyId)
    .maybeSingle();

  if (settingsError) throw settingsError;

  // Fetch accounts
  const accounts = await fetchAccounts(companyId);
  
  // Find VAT accounts by settings or by code pattern
  let vatPayableAccount = settings?.vat_payable_account_id 
    ? accounts.find(a => a.id === settings.vat_payable_account_id)
    : accounts.find(a => a.code === '2201');
  
  let vatRecoverableAccount = settings?.vat_recoverable_account_id
    ? accounts.find(a => a.id === settings.vat_recoverable_account_id)
    : accounts.find(a => a.code === '2202');

  // Build query for journal entries with VAT accounts
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      id,
      account_id,
      debit,
      credit,
      description,
      journal_entry:journal_entries!inner(
        id,
        entry_number,
        entry_date,
        description,
        reference_type,
        company_id,
        is_posted
      )
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  // Filter by accounts
  const vatAccountIds = [vatPayableAccount?.id, vatRecoverableAccount?.id].filter(Boolean);
  if (vatAccountIds.length > 0) {
    query = query.in('account_id', vatAccountIds);
  }

  if (startDate) {
    query = query.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('journal_entry.entry_date', endDate);
  }

  query = query.order('journal_entry(entry_date)', { ascending: true });

  const { data: lines, error: linesError } = await query;
  if (linesError) throw linesError;

  // Calculate balances
  let vatPayableBalance = 0; // Credit increases (liability)
  let vatRecoverableBalance = 0; // Debit increases (asset)
  const transactions: VATSettlementReport['transactions'] = [];

  (lines || []).forEach((line: any) => {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;
    
    if (line.account_id === vatPayableAccount?.id) {
      // VAT Payable - liability account (credit increases)
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
      // VAT Recoverable - asset account (debit increases)
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

  // Net VAT = VAT Payable - VAT Recoverable
  // Positive = company owes ZATCA
  // Negative = company is owed by ZATCA
  const netVAT = vatPayableBalance - vatRecoverableBalance;

  let status: 'payable' | 'receivable' | 'settled' = 'settled';
  if (netVAT > 0) {
    status = 'payable'; // الشركة مدينة لهيئة الزكاة
  } else if (netVAT < 0) {
    status = 'receivable'; // الشركة دائنة لهيئة الزكاة (مسترد)
  }

  return {
    vatPayable: {
      account: vatPayableAccount || null,
      balance: vatPayableBalance,
    },
    vatRecoverable: {
      account: vatRecoverableAccount || null,
      balance: vatRecoverableBalance,
    },
    netVAT,
    status,
    transactions,
  };
}
