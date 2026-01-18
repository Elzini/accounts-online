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
  const { data, error } = await supabase
    .from('account_categories')
    .select('*')
    .eq('company_id', companyId)
    .order('code', { ascending: true });
  
  if (error) throw error;
  return (data || []) as AccountCategory[];
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
    .order('entry_date', { ascending: false })
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
  lines: Array<{ account_id: string; description?: string; debit: number; credit: number }>
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

// Reports
export async function getAccountBalances(companyId: string): Promise<Array<{
  account: AccountCategory;
  debit_total: number;
  credit_total: number;
  balance: number;
}>> {
  const accounts = await fetchAccounts(companyId);
  
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);
  
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

export async function getTrialBalance(companyId: string): Promise<{
  accounts: Array<{ account: AccountCategory; debit: number; credit: number }>;
  totalDebit: number;
  totalCredit: number;
}> {
  const balances = await getAccountBalances(companyId);
  
  const accounts = balances.map(item => ({
    account: item.account,
    debit: item.balance > 0 ? item.balance : 0,
    credit: item.balance < 0 ? Math.abs(item.balance) : 0,
  }));

  const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);

  return { accounts, totalDebit, totalCredit };
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
