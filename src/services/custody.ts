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
  status: 'active' | 'settled' | 'partially_settled';
  settlement_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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

// Fetch all custodies with employee info
export async function fetchCustodies(companyId: string): Promise<Custody[]> {
  const { data, error } = await supabase
    .from('custodies')
    .select('*, employee:employees(id, name)')
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

// Calculate custody summary
export function calculateCustodySummary(custody: Custody) {
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
    isOverspent: remaining < 0
  };
}
