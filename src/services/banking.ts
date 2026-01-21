import { supabase } from "@/integrations/supabase/client";

// Types
export interface BankAccount {
  id: string;
  company_id: string;
  account_name: string;
  bank_name: string;
  account_number?: string;
  iban?: string;
  swift_code?: string;
  account_category_id?: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  account_category?: { id: string; code: string; name: string };
}

export interface BankStatement {
  id: string;
  company_id: string;
  bank_account_id: string;
  statement_date: string;
  file_name?: string;
  import_date: string;
  imported_by?: string;
  total_transactions: number;
  matched_transactions: number;
  unmatched_transactions: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  notes?: string;
  created_at: string;
  // Relations
  bank_account?: BankAccount;
  transactions?: BankTransaction[];
}

export interface BankTransaction {
  id: string;
  statement_id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date?: string;
  description?: string;
  reference?: string;
  debit: number;
  credit: number;
  balance?: number;
  is_matched: boolean;
  matched_type?: string;
  matched_id?: string;
  matched_at?: string;
  matched_by?: string;
  notes?: string;
  created_at: string;
}

export interface BankReconciliation {
  id: string;
  company_id: string;
  bank_account_id: string;
  reconciliation_date: string;
  statement_ending_balance: number;
  book_balance: number;
  adjusted_book_balance?: number;
  difference: number;
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  prepared_by?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  bank_account?: BankAccount;
}

export type BankAccountInsert = Omit<BankAccount, 'id' | 'created_at' | 'updated_at' | 'account_category'>;

// Bank Accounts
export async function fetchBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select(`
      *,
      account_category:account_categories(id, code, name)
    `)
    .order('account_name');
  
  if (error) throw error;
  return (data || []) as BankAccount[];
}

export async function addBankAccount(account: BankAccountInsert): Promise<BankAccount> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(account)
    .select()
    .single();
  
  if (error) throw error;
  return data as BankAccount;
}

export async function updateBankAccount(id: string, updates: Partial<BankAccountInsert>): Promise<BankAccount> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as BankAccount;
}

export async function deleteBankAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Bank Statements
export async function fetchBankStatements(bankAccountId?: string): Promise<BankStatement[]> {
  let query = supabase
    .from('bank_statements')
    .select(`
      *,
      bank_account:bank_accounts(id, account_name, bank_name)
    `)
    .order('statement_date', { ascending: false });
  
  if (bankAccountId) {
    query = query.eq('bank_account_id', bankAccountId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as BankStatement[];
}

export async function importBankStatement(
  bankAccountId: string,
  companyId: string,
  statementDate: string,
  transactions: Omit<BankTransaction, 'id' | 'statement_id' | 'bank_account_id' | 'created_at' | 'is_matched'>[],
  fileName?: string
): Promise<BankStatement> {
  // Create statement
  const { data: statement, error: stmtError } = await supabase
    .from('bank_statements')
    .insert({
      company_id: companyId,
      bank_account_id: bankAccountId,
      statement_date: statementDate,
      file_name: fileName,
      total_transactions: transactions.length,
      status: 'processing'
    })
    .select()
    .single();
  
  if (stmtError) throw stmtError;
  
  // Insert transactions
  if (transactions.length > 0) {
    const txns = transactions.map(t => ({
      ...t,
      statement_id: statement.id,
      bank_account_id: bankAccountId,
      is_matched: false
    }));
    
    const { error: txnError } = await supabase
      .from('bank_transactions')
      .insert(txns);
    
    if (txnError) throw txnError;
  }
  
  // Update statement status
  const { data, error } = await supabase
    .from('bank_statements')
    .update({ status: 'completed' })
    .eq('id', statement.id)
    .select()
    .single();
  
  if (error) throw error;
  return data as BankStatement;
}

// Bank Transactions
export async function fetchBankTransactions(statementId: string): Promise<BankTransaction[]> {
  const { data, error } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('statement_id', statementId)
    .order('transaction_date', { ascending: false });
  
  if (error) throw error;
  return (data || []) as BankTransaction[];
}

export async function matchTransaction(
  transactionId: string,
  matchedType: string,
  matchedId: string
): Promise<BankTransaction> {
  const { data, error } = await supabase
    .from('bank_transactions')
    .update({
      is_matched: true,
      matched_type: matchedType,
      matched_id: matchedId,
      matched_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Update statement matched count
  const { data: txn } = await supabase
    .from('bank_transactions')
    .select('statement_id')
    .eq('id', transactionId)
    .single();
  
  if (txn) {
    const { data: matchedCount } = await supabase
      .from('bank_transactions')
      .select('id', { count: 'exact' })
      .eq('statement_id', txn.statement_id)
      .eq('is_matched', true);
    
    const { data: unmatchedCount } = await supabase
      .from('bank_transactions')
      .select('id', { count: 'exact' })
      .eq('statement_id', txn.statement_id)
      .eq('is_matched', false);
    
    await supabase
      .from('bank_statements')
      .update({
        matched_transactions: matchedCount?.length || 0,
        unmatched_transactions: unmatchedCount?.length || 0
      })
      .eq('id', txn.statement_id);
  }
  
  return data as BankTransaction;
}

export async function unmatchTransaction(transactionId: string): Promise<BankTransaction> {
  const { data, error } = await supabase
    .from('bank_transactions')
    .update({
      is_matched: false,
      matched_type: null,
      matched_id: null,
      matched_at: null,
      matched_by: null
    })
    .eq('id', transactionId)
    .select()
    .single();
  
  if (error) throw error;
  return data as BankTransaction;
}

// Bank Reconciliations
export async function fetchBankReconciliations(bankAccountId?: string): Promise<BankReconciliation[]> {
  let query = supabase
    .from('bank_reconciliations')
    .select(`
      *,
      bank_account:bank_accounts(id, account_name, bank_name)
    `)
    .order('reconciliation_date', { ascending: false });
  
  if (bankAccountId) {
    query = query.eq('bank_account_id', bankAccountId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as BankReconciliation[];
}

export async function createBankReconciliation(
  bankAccountId: string,
  companyId: string,
  reconciliationDate: string,
  statementEndingBalance: number,
  bookBalance: number
): Promise<BankReconciliation> {
  const difference = statementEndingBalance - bookBalance;
  
  const { data, error } = await supabase
    .from('bank_reconciliations')
    .insert({
      company_id: companyId,
      bank_account_id: bankAccountId,
      reconciliation_date: reconciliationDate,
      statement_ending_balance: statementEndingBalance,
      book_balance: bookBalance,
      difference: difference,
      status: 'draft'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as BankReconciliation;
}

export async function updateBankReconciliation(
  id: string,
  updates: Partial<Omit<BankReconciliation, 'id' | 'created_at' | 'updated_at' | 'bank_account'>>
): Promise<BankReconciliation> {
  const { data, error } = await supabase
    .from('bank_reconciliations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as BankReconciliation;
}

// Utility: Parse CSV/Excel bank statement
export function parseBankStatementCSV(csvContent: string): Omit<BankTransaction, 'id' | 'statement_id' | 'bank_account_id' | 'created_at' | 'is_matched'>[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const transactions: Omit<BankTransaction, 'id' | 'statement_id' | 'bank_account_id' | 'created_at' | 'is_matched'>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    
    // Map common column names
    const dateCol = row['date'] || row['transaction_date'] || row['تاريخ'] || row['التاريخ'] || '';
    const descCol = row['description'] || row['details'] || row['الوصف'] || row['البيان'] || '';
    const refCol = row['reference'] || row['ref'] || row['المرجع'] || '';
    const debitCol = row['debit'] || row['withdrawal'] || row['مدين'] || row['سحب'] || '0';
    const creditCol = row['credit'] || row['deposit'] || row['دائن'] || row['إيداع'] || '0';
    const balanceCol = row['balance'] || row['الرصيد'] || '';
    
    if (dateCol) {
      transactions.push({
        transaction_date: dateCol,
        description: descCol,
        reference: refCol,
        debit: parseFloat(debitCol.replace(/[^0-9.-]/g, '')) || 0,
        credit: parseFloat(creditCol.replace(/[^0-9.-]/g, '')) || 0,
        balance: balanceCol ? parseFloat(balanceCol.replace(/[^0-9.-]/g, '')) : undefined
      });
    }
  }
  
  return transactions;
}
