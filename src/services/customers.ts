/**
 * Customer Service - Isolated CRUD operations for customers
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import type { Database } from '@/integrations/supabase/types';
import { requireCompanyId } from '@/services/companyContext';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

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
