import { supabase } from '@/integrations/supabase/client';

export interface Custody {
  id: string;
  company_id: string;
  fiscal_year_id: string | null;
  employee_id: string | null;
  custody_number: number;
  custody_name: string;
  custody_amount: number;
  custody_date: string;
  status: 'active' | 'settled' | 'partially_settled' | 'carried';
  settlement_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  journal_entry_id: string | null;
  custody_account_id: string | null;
  cash_account_id: string | null;
  custody_type: 'custody' | 'advance';
  advance_id: string | null;
  installment_amount: number;
  installment_count: number;
  employee?: {
    id: string;
    name: string;
  };
  transactions?: CustodyTransaction[];
}

export interface CustodyTransaction {
  id: string;
  custody_id: string;
  company_id: string;
  transaction_date: string;
  description: string;
  analysis_category: string | null;
  amount: number;
  account_id: string | null;
  journal_entry_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  account?: {
    id: string;
    code: string;
    name: string;
  };
}

export type CustodyInsert = Omit<Custody, 'id' | 'custody_number' | 'created_at' | 'updated_at' | 'employee' | 'transactions'>;
export type CustodyTransactionInsert = Omit<CustodyTransaction, 'id' | 'created_at' | 'updated_at' | 'account'>;

// Create employee advance record linked to custody
export async function createEmployeeAdvance(
  companyId: string,
  employeeId: string,
  amount: number,
  advanceDate: string,
  reason: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from('employee_advances')
    .insert({
      company_id: companyId,
      employee_id: employeeId,
      amount,
      advance_date: advanceDate,
      reason,
      is_deducted: false,
      notes: 'تم إنشاؤها من نظام العهد',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

// Fetch all custodies with employee info
export async function fetchCustodies(companyId: string): Promise<Custody[]> {
  const { data, error } = await supabase
    .from('custodies')
    .select('*, employee:employees(id, name), transactions:custody_transactions(id, custody_id, company_id, transaction_date, description, analysis_category, amount, account_id, journal_entry_id, notes, created_by, created_at, updated_at)')
    .eq('company_id', companyId)
    .order('custody_date', { ascending: false });
  
  if (error) throw error;
  return data as Custody[];
}

// Fetch single custody with transactions
export async function fetchCustodyWithTransactions(custodyId: string): Promise<Custody | null> {
  const { data: custody, error: custodyError } = await supabase
    .from('custodies')
    .select('*, employee:employees(id, name)')
    .eq('id', custodyId)
    .single();
  
  if (custodyError) throw custodyError;
  if (!custody) return null;

  const { data: transactions, error: transError } = await supabase
    .from('custody_transactions')
    .select('*, account:account_categories(id, code, name)')
    .eq('custody_id', custodyId)
    .order('transaction_date', { ascending: true });
  
  if (transError) throw transError;

  return {
    ...custody,
    transactions: transactions || []
  } as Custody;
}

// Create journal entry for custody creation (Dr. Custody Account → Cr. Cash Account)
export async function createCustodyJournalEntry(
  companyId: string,
  custodyName: string,
  amount: number,
  custodyAccountId: string,
  cashAccountId: string,
  custodyDate: string,
  fiscalYearId: string | null,
): Promise<string> {
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      description: `إنشاء عهدة - ${custodyName}`,
      entry_date: custodyDate,
      reference_type: 'custody',
      total_debit: amount,
      total_credit: amount,
      is_posted: true,
      fiscal_year_id: fiscalYearId,
    })
    .select()
    .single();

  if (journalError) throw journalError;

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert([
      {
        journal_entry_id: journalEntry.id,
        account_id: custodyAccountId,
        description: `عهدة - ${custodyName}`,
        debit: amount,
        credit: 0,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: cashAccountId,
        description: `صرف عهدة - ${custodyName}`,
        debit: 0,
        credit: amount,
      },
    ]);

  if (linesError) throw linesError;

  return journalEntry.id;
}

// Create journal entry for custody transaction (Dr. Expense Account → Cr. Custody Account)
export async function createTransactionJournalEntry(
  companyId: string,
  custodyName: string,
  transactionDescription: string,
  amount: number,
  expenseAccountId: string,
  custodyAccountId: string,
  transactionDate: string,
  fiscalYearId: string | null,
): Promise<string> {
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      description: `تحليل عهدة - ${custodyName}: ${transactionDescription}`,
      entry_date: transactionDate,
      reference_type: 'custody_transaction',
      total_debit: amount,
      total_credit: amount,
      is_posted: true,
      fiscal_year_id: fiscalYearId,
    })
    .select()
    .single();

  if (journalError) throw journalError;

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert([
      {
        journal_entry_id: journalEntry.id,
        account_id: expenseAccountId,
        description: transactionDescription,
        debit: amount,
        credit: 0,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: custodyAccountId,
        description: `تسوية عهدة - ${custodyName}`,
        debit: 0,
        credit: amount,
      },
    ]);

  if (linesError) throw linesError;

  return journalEntry.id;
}

// Add new custody
export async function addCustody(custody: CustodyInsert): Promise<Custody> {
  const { data, error } = await supabase
    .from('custodies')
    .insert(custody)
    .select('*, employee:employees(id, name)')
    .single();
  
  if (error) throw error;
  return data as Custody;
}

// Update custody
export async function updateCustody(id: string, updates: Partial<CustodyInsert>): Promise<Custody> {
  const { data, error } = await supabase
    .from('custodies')
    .update(updates)
    .eq('id', id)
    .select('*, employee:employees(id, name)')
    .single();
  
  if (error) throw error;
  return data as Custody;
}

// Delete custody
export async function deleteCustody(id: string): Promise<void> {
  const { error } = await supabase
    .from('custodies')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Add custody transaction
export async function addCustodyTransaction(transaction: CustodyTransactionInsert): Promise<CustodyTransaction> {
  const { data, error } = await supabase
    .from('custody_transactions')
    .insert(transaction)
    .select('*, account:account_categories(id, code, name)')
    .single();
  
  if (error) throw error;
  return data as CustodyTransaction;
}

// Update custody transaction
export async function updateCustodyTransaction(id: string, updates: Partial<CustodyTransactionInsert>): Promise<CustodyTransaction> {
  const { data, error } = await supabase
    .from('custody_transactions')
    .update(updates)
    .eq('id', id)
    .select('*, account:account_categories(id, code, name)')
    .single();
  
  if (error) throw error;
  return data as CustodyTransaction;
}

// Delete custody transaction
export async function deleteCustodyTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('custody_transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Settle custody
export async function settleCustody(id: string, settlementDate: string): Promise<Custody> {
  const { data, error } = await supabase
    .from('custodies')
    .update({
      status: 'settled',
      settlement_date: settlementDate
    })
    .eq('id', id)
    .select('*, employee:employees(id, name)')
    .single();
  
  if (error) throw error;
  return data as Custody;
}

// Get carried balance for an employee (from 'carried' status custodies)
export async function getEmployeeCarriedBalance(companyId: string, employeeId: string): Promise<number> {
  const { data, error } = await supabase
    .from('custodies')
    .select('custody_amount')
    .eq('company_id', companyId)
    .eq('employee_id', employeeId)
    .eq('status', 'carried');
  
  if (error) throw error;
  return (data || []).reduce((sum, c) => sum + Number(c.custody_amount), 0);
}

// Resolve carried custodies for an employee (mark as settled after deduction)
export async function resolveCarriedCustodies(companyId: string, employeeId: string): Promise<void> {
  const { error } = await supabase
    .from('custodies')
    .update({ status: 'settled', settlement_date: new Date().toISOString().split('T')[0] })
    .eq('company_id', companyId)
    .eq('employee_id', employeeId)
    .eq('status', 'carried');
  
  if (error) throw error;
}

// Calculate custody summary
export function calculateCustodySummary(custody: Custody) {
  if (custody.status === 'carried') {
    const totalSpent = custody.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    return {
      custodyAmount: 0,
      totalSpent,
      remaining: 0,
      returnedAmount: 0,
      carriedBalance: Number(custody.custody_amount),
      isOverspent: false,
      isCarried: true,
    };
  }

  const totalSpent = custody.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const remaining = Number(custody.custody_amount) - totalSpent;
  const returnedAmount = remaining > 0 ? remaining : 0;
  const carriedBalance = remaining < 0 ? Math.abs(remaining) : 0;

  return {
    custodyAmount: Number(custody.custody_amount),
    totalSpent,
    remaining,
    returnedAmount,
    carriedBalance,
    isOverspent: remaining < 0,
    isCarried: false,
  };
}
