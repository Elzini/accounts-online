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

const normalizeArabicDigits = (value: string): string =>
  value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const toSafeNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;

  const normalized = normalizeArabicDigits(String(value))
    .replace(/٫/g, '.')
    .replace(/[٬،]/g, ',')
    .replace(/[^0-9,.-]/g, '')
    .replace(/,/g, '');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isValidDateParts = (year: number, month: number, day: number): boolean => {
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};

const toISODate = (value: unknown, fallback: string): string => {
  if (value === null || value === undefined || value === '') return fallback;

  const raw = normalizeArabicDigits(String(value).trim());
  if (!raw) return fallback;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  const normalized = raw.replace(/[.\-]/g, '/');
  const parts = normalized.split('/').map((part) => Number.parseInt(part, 10));

  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    if (String(parts[0]).length === 4) {
      const [year, month, day] = parts;
      if (isValidDateParts(year, month, day)) {
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    } else {
      let [part1, part2, year] = parts;
      if (year < 100) year += 2000;

      const monthFirstValid = isValidDateParts(year, part1, part2);
      const dayFirstValid = isValidDateParts(year, part2, part1);

      if (monthFirstValid) {
        return `${year.toString().padStart(4, '0')}-${part1.toString().padStart(2, '0')}-${part2.toString().padStart(2, '0')}`;
      }

      if (dayFirstValid) {
        return `${year.toString().padStart(4, '0')}-${part2.toString().padStart(2, '0')}-${part1.toString().padStart(2, '0')}`;
      }
    }
  }

  return fallback;
};

// Bank Accounts
// Use bank_accounts_safe view for read operations to mask sensitive fields (account numbers, IBAN)
export async function fetchBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts_safe')
    .select(`
      *,
      account_category:account_categories(id, code, name)
    `)
    .order('account_name');
  
  if (error) throw error;
  // Map masked fields back to expected field names for UI compatibility
  return (data || []).map(account => ({
    ...account,
    account_number: account.account_number_masked,
    iban: account.iban_masked,
    swift_code: account.swift_code_masked,
    // Not exposed in safe view - provide null for type compatibility
    account_number_encrypted: null as string | null,
    iban_encrypted: null as string | null,
  })) as BankAccount[];
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
  const fallbackDate = new Date().toISOString().slice(0, 10);
  const normalizedStatementDate = toISODate(statementDate, fallbackDate);

  const normalizedTransactions = transactions.map((transaction) => {
    const debit = Math.max(0, toSafeNumber(transaction.debit));
    const credit = Math.max(0, toSafeNumber(transaction.credit));
    const hasBalance = transaction.balance !== undefined && transaction.balance !== null && transaction.balance !== '';

    return {
      transaction_date: toISODate(transaction.transaction_date, normalizedStatementDate),
      value_date: transaction.value_date ? toISODate(transaction.value_date, normalizedStatementDate) : null,
      description: transaction.description?.toString().trim() || null,
      reference: transaction.reference?.toString().trim() || null,
      notes: transaction.notes?.toString().trim() || null,
      debit,
      credit,
      balance: hasBalance ? toSafeNumber(transaction.balance) : null,
    };
  });

  // Create statement
  const { data: statement, error: stmtError } = await supabase
    .from('bank_statements')
    .insert({
      company_id: companyId,
      bank_account_id: bankAccountId,
      statement_date: normalizedStatementDate,
      file_name: fileName,
      total_transactions: normalizedTransactions.length,
      status: 'processing'
    })
    .select()
    .single();

  if (stmtError) throw stmtError;

  // Insert transactions
  if (normalizedTransactions.length > 0) {
    const txns = normalizedTransactions.map((transaction) => ({
      ...transaction,
      statement_id: statement.id,
      bank_account_id: bankAccountId,
      is_matched: false,
    }));

    const chunkSize = 500;
    for (let i = 0; i < txns.length; i += chunkSize) {
      const chunk = txns.slice(i, i + chunkSize);
      const { error: txnError } = await supabase
        .from('bank_transactions')
        .insert(chunk);

      if (txnError) {
        await supabase
          .from('bank_statements')
          .update({
            status: 'error',
            notes: `Import failed: ${txnError.message}`,
          })
          .eq('id', statement.id);

        throw txnError;
      }
    }
  }

  // Update statement status
  const { data, error } = await supabase
    .from('bank_statements')
    .update({
      status: 'completed',
      matched_transactions: 0,
      unmatched_transactions: normalizedTransactions.length,
    })
    .eq('id', statement.id)
    .select()
    .single();

  if (error) throw error;
  return data as BankStatement;
}

export async function updateBankStatement(id: string, updates: { statement_date?: string; notes?: string; file_name?: string }): Promise<BankStatement> {
  const { data, error } = await supabase
    .from('bank_statements')
    .update(updates)
    .eq('id', id)
    .select(`*, bank_account:bank_accounts(id, account_name, bank_name)`)
    .single();
  if (error) throw error;
  return data as BankStatement;
}

export async function deleteBankStatement(id: string): Promise<void> {
  // Delete transactions first
  const { error: txnError } = await supabase
    .from('bank_transactions')
    .delete()
    .eq('statement_id', id);
  if (txnError) throw txnError;

  const { error } = await supabase
    .from('bank_statements')
    .delete()
    .eq('id', id);
  if (error) throw error;
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
