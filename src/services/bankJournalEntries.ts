/**
 * Bank Journal Entry Service
 * Creates journal entries from classified bank transactions.
 * Uses ServiceContainer for all journal writes.
 */

import { supabase } from '@/integrations/supabase/untypedFrom';
import { getServiceContainer } from '@/core/engine/serviceContainer';

export interface TransactionClassification {
  index: number;
  account_id: string;
  account_code: string;
  account_name: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ClassifiedTransaction {
  id: string;
  transaction_date: string;
  description?: string | null;
  reference?: string | null;
  debit: number;
  credit: number;
  balance?: number | null;
  classified_account_id?: string;
  classified_account_code?: string;
  classified_account_name?: string;
  confidence?: 'high' | 'medium' | 'low';
  reason?: string;
}

export async function classifyTransactions(
  transactions: any[],
  companyId: string
): Promise<TransactionClassification[]> {
  const { data, error } = await supabase.functions.invoke('classify-bank-transactions', {
    body: { transactions, companyId },
  });
  if (error) throw new Error(error.message || 'فشل في تصنيف المعاملات');
  if (data?.error) throw new Error(data.error);
  return (data?.classifications || []) as TransactionClassification[];
}

export async function createJournalEntriesFromTransactions(
  transactions: ClassifiedTransaction[],
  bankAccountCategoryId: string,
  companyId: string,
  statementId: string,
  fiscalYearId?: string | null,
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;
  const { journal } = getServiceContainer(companyId);

  for (const txn of transactions) {
    if (!txn.classified_account_id) {
      errors.push(`معاملة ${txn.description || txn.transaction_date}: لم يتم تحديد الحساب المقابل`);
      continue;
    }

    const amount = Number(txn.debit) > 0 ? Number(txn.debit) : Number(txn.credit);
    if (amount <= 0) {
      errors.push(`معاملة ${txn.description || txn.transaction_date}: المبلغ غير صالح`);
      continue;
    }

    const isDebit = Number(txn.debit) > 0;

    try {
      const lines = isDebit
        ? [
            { account_id: txn.classified_account_id, description: txn.description || 'معاملة بنكية', debit: amount, credit: 0 },
            { account_id: bankAccountCategoryId, description: txn.description || 'معاملة بنكية', debit: 0, credit: amount },
          ]
        : [
            { account_id: bankAccountCategoryId, description: txn.description || 'معاملة بنكية', debit: amount, credit: 0 },
            { account_id: txn.classified_account_id, description: txn.description || 'معاملة بنكية', debit: 0, credit: amount },
          ];

      const entry = await journal.createEntry({
        company_id: companyId,
        fiscal_year_id: fiscalYearId || '',
        entry_date: txn.transaction_date,
        description: `كشف بنكي: ${txn.description || 'معاملة بنكية'}`,
        reference_type: 'bank_transaction' as any,
        reference_id: txn.id,
        is_posted: true,
        lines,
      });

      // Mark transaction as matched
      await supabase
        .from('bank_transactions')
        .update({
          is_matched: true,
          matched_type: 'journal_entry',
          matched_id: entry.id,
          matched_at: new Date().toISOString(),
        })
        .eq('id', txn.id);

      created++;
    } catch (e: any) {
      errors.push(`معاملة ${txn.description || txn.transaction_date}: ${e.message}`);
    }
  }

  // Update statement matched/unmatched counts
  if (created > 0) {
    const { data: allTxns } = await supabase
      .from('bank_transactions')
      .select('is_matched')
      .eq('statement_id', statementId);

    const matched = (allTxns || []).filter(t => t.is_matched).length;
    const unmatched = (allTxns || []).length - matched;

    await supabase
      .from('bank_statements')
      .update({ matched_transactions: matched, unmatched_transactions: unmatched })
      .eq('id', statementId);
  }

  return { created, errors };
}
