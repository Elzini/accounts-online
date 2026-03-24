import { supabase } from "@/integrations/supabase/client";
import { BankStatement, BankTransaction } from './types';
import { toSafeNumber, toISODate } from './utils';

export async function fetchBankStatements(bankAccountId?: string): Promise<BankStatement[]> {
  let query = supabase
    .from('bank_statements')
    .select(`*, bank_account:bank_accounts(id, account_name, bank_name)`)
    .order('statement_date', { ascending: false });
  if (bankAccountId) query = query.eq('bank_account_id', bankAccountId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as BankStatement[];
}

export async function importBankStatement(
  bankAccountId: string, companyId: string, statementDate: string,
  transactions: Omit<BankTransaction, 'id' | 'statement_id' | 'bank_account_id' | 'created_at' | 'is_matched'>[],
  fileName?: string
): Promise<BankStatement> {
  const fallbackDate = new Date().toISOString().slice(0, 10);
  const normalizedStatementDate = toISODate(statementDate, fallbackDate);

  const normalizedTransactions = transactions.map((transaction) => ({
    transaction_date: toISODate(transaction.transaction_date, normalizedStatementDate),
    value_date: transaction.value_date ? toISODate(transaction.value_date, normalizedStatementDate) : null,
    description: transaction.description?.toString().trim() || null,
    reference: transaction.reference?.toString().trim() || null,
    notes: transaction.notes?.toString().trim() || null,
    debit: Math.max(0, toSafeNumber(transaction.debit)),
    credit: Math.max(0, toSafeNumber(transaction.credit)),
    balance: transaction.balance !== undefined && transaction.balance !== null ? toSafeNumber(transaction.balance) : null,
  }));

  const { data: statement, error: stmtError } = await supabase
    .from('bank_statements')
    .insert({ company_id: companyId, bank_account_id: bankAccountId, statement_date: normalizedStatementDate, file_name: fileName, total_transactions: normalizedTransactions.length, status: 'processing' })
    .select().single();
  if (stmtError) throw stmtError;

  if (normalizedTransactions.length > 0) {
    const txns = normalizedTransactions.map((t) => ({ ...t, statement_id: statement.id, bank_account_id: bankAccountId, is_matched: false }));
    const chunkSize = 500;
    for (let i = 0; i < txns.length; i += chunkSize) {
      const { error: txnError } = await supabase.from('bank_transactions').insert(txns.slice(i, i + chunkSize));
      if (txnError) {
        await supabase.from('bank_statements').update({ status: 'error', notes: `Import failed: ${txnError.message}` }).eq('id', statement.id);
        throw txnError;
      }
    }
  }

  const { data, error } = await supabase
    .from('bank_statements')
    .update({ status: 'completed', matched_transactions: 0, unmatched_transactions: normalizedTransactions.length })
    .eq('id', statement.id).select().single();
  if (error) throw error;
  return data as BankStatement;
}

export async function updateBankStatement(id: string, updates: { statement_date?: string; notes?: string; file_name?: string }): Promise<BankStatement> {
  const { data, error } = await supabase.from('bank_statements').update(updates).eq('id', id).select(`*, bank_account:bank_accounts(id, account_name, bank_name)`).single();
  if (error) throw error;
  return data as BankStatement;
}

export async function deleteBankStatement(id: string): Promise<void> {
  const { error: txnError } = await supabase.from('bank_transactions').delete().eq('statement_id', id);
  if (txnError) throw txnError;
  const { error } = await supabase.from('bank_statements').delete().eq('id', id);
  if (error) throw error;
}
