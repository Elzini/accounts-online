/**
 * Customer Service - Isolated CRUD operations for customers
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getCompanyOverride } from '@/lib/companyOverride';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

async function requireCompanyId(): Promise<string> {
  const override = getCompanyOverride();
  if (override) return override;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('COMPANY_REQUIRED');
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single();
  if (!profile?.company_id) throw new Error('COMPANY_REQUIRED');
  return profile.company_id;
}

export async function fetchCustomers() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('customers_safe')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data?.map(customer => ({
    ...customer,
    id_number_encrypted: null as string | null,
  })) || [];
}

export async function addCustomer(customer: CustomerInsert) {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...customer, company_id: companyId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, customer: CustomerUpdate) {
  const { data, error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}
