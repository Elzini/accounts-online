import { supabase } from '@/hooks/modules/useMiscServices';
import { AccountCategory } from './types';

export async function fetchAccounts(companyId: string): Promise<AccountCategory[]> {
  const allData: AccountCategory[] = [];
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('account_categories')
      .select('*')
      .eq('company_id', companyId)
      .order('code', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...(data as AccountCategory[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  return allData;
}

export async function createDefaultAccounts(companyId: string): Promise<void> {
  const { error } = await supabase.rpc('create_default_accounts', { p_company_id: companyId });
  if (error) throw error;
}

export async function addAccount(account: Omit<AccountCategory, 'id' | 'created_at' | 'updated_at'>): Promise<AccountCategory> {
  const { data, error } = await supabase
    .from('account_categories')
    .insert(account)
    .select()
    .single();
  
  if (error) throw error;
  return data as AccountCategory;
}

export async function updateAccount(id: string, updates: Partial<AccountCategory>): Promise<AccountCategory> {
  const { data, error } = await supabase
    .from('account_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as AccountCategory;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('account_categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
