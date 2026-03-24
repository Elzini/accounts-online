import { supabase } from "@/integrations/supabase/client";
import { BankReconciliation } from './types';

export async function fetchBankReconciliations(bankAccountId?: string): Promise<BankReconciliation[]> {
  let query = supabase
    .from('bank_reconciliations')
    .select(`*, bank_account:bank_accounts(id, account_name, bank_name)`)
    .order('reconciliation_date', { ascending: false });
  if (bankAccountId) query = query.eq('bank_account_id', bankAccountId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as BankReconciliation[];
}

export async function createBankReconciliation(
  bankAccountId: string, companyId: string, reconciliationDate: string,
  statementEndingBalance: number, bookBalance: number
): Promise<BankReconciliation> {
  const { data, error } = await supabase
    .from('bank_reconciliations')
    .insert({ company_id: companyId, bank_account_id: bankAccountId, reconciliation_date: reconciliationDate, statement_ending_balance: statementEndingBalance, book_balance: bookBalance, difference: statementEndingBalance - bookBalance, status: 'draft' })
    .select().single();
  if (error) throw error;
  return data as BankReconciliation;
}

export async function updateBankReconciliation(
  id: string, updates: Partial<Omit<BankReconciliation, 'id' | 'created_at' | 'updated_at' | 'bank_account'>>
): Promise<BankReconciliation> {
  const { data, error } = await supabase.from('bank_reconciliations').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as BankReconciliation;
}
