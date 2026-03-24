import { supabase } from "@/integrations/supabase/client";
import { BankAccount, BankAccountInsert } from './types';

export async function fetchBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts_safe')
    .select(`*, account_category:account_categories(id, code, name)`)
    .order('account_name');
  if (error) throw error;
  return (data || []).map(account => ({
    ...account,
    account_number: account.account_number_masked,
    iban: account.iban_masked,
    swift_code: account.swift_code_masked,
    account_number_encrypted: null as string | null,
    iban_encrypted: null as string | null,
  })) as BankAccount[];
}

export async function addBankAccount(account: BankAccountInsert): Promise<BankAccount> {
  const { data, error } = await supabase.from('bank_accounts').insert(account).select().single();
  if (error) throw error;
  return data as BankAccount;
}

export async function updateBankAccount(id: string, updates: Partial<BankAccountInsert>): Promise<BankAccount> {
  const { data, error } = await supabase.from('bank_accounts').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as BankAccount;
}

export async function deleteBankAccount(id: string): Promise<void> {
  const { count: statementsCount } = await supabase.from('bank_statements').select('*', { count: 'exact', head: true }).eq('bank_account_id', id);
  if (statementsCount && statementsCount > 0) throw new Error('HAS_RELATED_DATA');

  const { count: reconCount } = await supabase.from('bank_reconciliations').select('*', { count: 'exact', head: true }).eq('bank_account_id', id);
  if (reconCount && reconCount > 0) throw new Error('HAS_RELATED_DATA');

  const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
  if (error) throw error;
}
