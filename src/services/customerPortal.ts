/**
 * Customer Portal Service
 */
import { supabase } from '@/integrations/supabase/client';

export async function fetchPortalTokens(companyId: string) {
  const { data, error } = await supabase.from('customer_portal_tokens').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchPortalSales(companyId: string, hasCarInventory: boolean) {
  if (hasCarInventory) {
    const { data } = await supabase.from('sales').select('id, sale_number, customer_id, sale_price, sale_date, due_date, payment_status').eq('company_id', companyId).order('sale_date', { ascending: false }).limit(50);
    return data || [];
  } else {
    const { data } = await supabase.from('invoices').select('id, invoice_number, customer_id, total, invoice_date, due_date, payment_status').eq('company_id', companyId).eq('invoice_type', 'sales').neq('status', 'draft').order('invoice_date', { ascending: false }).limit(50);
    return data || [];
  }
}

export async function fetchPortalCustomers(companyId: string) {
  const { data } = await supabase.from('customers').select('id, name').eq('company_id', companyId).order('name');
  return data || [];
}

export async function addPortalAccess(companyId: string, customerId: string) {
  const { error } = await supabase.from('customer_portal_tokens').insert({ company_id: companyId, customer_id: customerId });
  if (error) throw error;
}

export async function togglePortalAccess(id: string, isActive: boolean) {
  const { error } = await supabase.from('customer_portal_tokens').update({ is_active: !isActive }).eq('id', id);
  if (error) throw error;
}

export async function deletePortalAccess(id: string) {
  const { error } = await supabase.from('customer_portal_tokens').delete().eq('id', id);
  if (error) throw error;
}
