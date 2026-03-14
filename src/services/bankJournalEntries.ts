import { supabase } from '@/integrations/supabase/client';

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
  description: string | null;
  reference: string | null;
  debit: number;
  credit: number;
  balance: number | null;
  // Classification fields
  classified_account_id?: string;
  classified_account_code?: string;
  classified_account_name?: string;
  confidence?: 'high' | 'medium' | 'low';
  reason?: string;
}

/**
 * Call AI to classify bank transactions against chart of accounts
 */
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

/**
 * Create journal entries from classified bank transactions
 */
export async function createJournalEntriesFromTransactions(
  transactions: ClassifiedTransaction[],
  bankAccountCategoryId: string,
  companyId: string,
  statementId: string,
  fiscalYearId?: string | null,
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

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

    const isDebit = Number(txn.debit) > 0; // withdrawal from bank

    try {
      // Create journal entry
      const { data: journalEntry, error: jeError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          description: `كشف بنكي: ${txn.description || 'معاملة بنكية'}`,
          entry_date: txn.transaction_date,
          reference_type: 'bank_transaction',
          reference_id: txn.id,
          total_debit: amount,
          total_credit: amount,
          is_posted: true,
          fiscal_year_id: fiscalYearId || null,
        })
        .select()
        .single();

      if (jeError) {
        errors.push(`معاملة ${txn.description || txn.transaction_date}: ${jeError.message}`);
        continue;
      }

      // Create journal entry lines
      // If debit (withdrawal): Debit the classified account, Credit the bank
      // If credit (deposit): Debit the bank, Credit the classified account
      const lines = isDebit
        ? [
            {
              journal_entry_id: journalEntry.id,
              account_id: txn.classified_account_id,
              description: txn.description || 'معاملة بنكية',
              debit: amount,
              credit: 0,
            },
            {
              journal_entry_id: journalEntry.id,
              account_id: bankAccountCategoryId,
              description: txn.description || 'معاملة بنكية',
              debit: 0,
              credit: amount,
            },
          ]
        : [
            {
              journal_entry_id: journalEntry.id,
              account_id: bankAccountCategoryId,
              description: txn.description || 'معاملة بنكية',
              debit: amount,
              credit: 0,
            },
            {
              journal_entry_id: journalEntry.id,
              account_id: txn.classified_account_id,
              description: txn.description || 'معاملة بنكية',
              debit: 0,
              credit: amount,
            },
          ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) {
        // Rollback: delete the journal entry
        await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
        errors.push(`معاملة ${txn.description || txn.transaction_date}: ${linesError.message}`);
        continue;
      }

      // Mark transaction as matched
      await supabase
        .from('bank_transactions')
        .update({
          is_matched: true,
          matched_type: 'journal_entry',
          matched_id: journalEntry.id,
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
