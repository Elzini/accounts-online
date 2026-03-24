import { supabase } from "@/integrations/supabase/client";
import { BankTransaction } from './types';

export async function fetchBankTransactions(statementId: string): Promise<BankTransaction[]> {
  const { data, error } = await supabase
    .from('bank_transactions').select('*').eq('statement_id', statementId)
    .order('transaction_date', { ascending: false });
  if (error) throw error;
  return (data || []) as BankTransaction[];
}

export async function matchTransaction(transactionId: string, matchedType: string, matchedId: string): Promise<BankTransaction> {
  const { data, error } = await supabase
    .from('bank_transactions')
    .update({ is_matched: true, matched_type: matchedType, matched_id: matchedId, matched_at: new Date().toISOString() })
    .eq('id', transactionId).select().single();
  if (error) throw error;

  const { data: txn } = await supabase.from('bank_transactions').select('statement_id').eq('id', transactionId).single();
  if (txn) {
    const { data: matchedCount } = await supabase.from('bank_transactions').select('id', { count: 'exact' }).eq('statement_id', txn.statement_id).eq('is_matched', true);
    const { data: unmatchedCount } = await supabase.from('bank_transactions').select('id', { count: 'exact' }).eq('statement_id', txn.statement_id).eq('is_matched', false);
    await supabase.from('bank_statements').update({ matched_transactions: matchedCount?.length || 0, unmatched_transactions: unmatchedCount?.length || 0 }).eq('id', txn.statement_id);
  }
  return data as BankTransaction;
}

export async function unmatchTransaction(transactionId: string): Promise<BankTransaction> {
  const { data, error } = await supabase
    .from('bank_transactions')
    .update({ is_matched: false, matched_type: null, matched_id: null, matched_at: null, matched_by: null })
    .eq('id', transactionId).select().single();
  if (error) throw error;
  return data as BankTransaction;
}

export function parseBankStatementCSV(csvContent: string): Omit<BankTransaction, 'id' | 'statement_id' | 'bank_account_id' | 'created_at' | 'is_matched'>[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const transactions: Omit<BankTransaction, 'id' | 'statement_id' | 'bank_account_id' | 'created_at' | 'is_matched'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

    const dateCol = row['date'] || row['transaction_date'] || row['تاريخ'] || row['التاريخ'] || '';
    const descCol = row['description'] || row['details'] || row['الوصف'] || row['البيان'] || '';
    const refCol = row['reference'] || row['ref'] || row['المرجع'] || '';
    const debitCol = row['debit'] || row['withdrawal'] || row['مدين'] || row['سحب'] || '0';
    const creditCol = row['credit'] || row['deposit'] || row['دائن'] || row['إيداع'] || '0';
    const balanceCol = row['balance'] || row['الرصيد'] || '';

    if (dateCol) {
      transactions.push({
        transaction_date: dateCol, description: descCol, reference: refCol,
        debit: parseFloat(debitCol.replace(/[^0-9.-]/g, '')) || 0,
        credit: parseFloat(creditCol.replace(/[^0-9.-]/g, '')) || 0,
        balance: balanceCol ? parseFloat(balanceCol.replace(/[^0-9.-]/g, '')) : undefined
      });
    }
  }
  return transactions;
}
