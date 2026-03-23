/**
 * Branch Comparison Service
 */
import { supabase } from '@/integrations/supabase/client';

export async function fetchActiveBranches(companyId: string) {
  const { data } = await supabase.from('branches').select('*').eq('company_id', companyId).eq('is_active', true);
  return data || [];
}

export async function fetchBranchSales(companyId: string) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { data } = await supabase.from('sales').select('sale_price, purchase_price, customer_id').eq('company_id', companyId).gte('sale_date', monthStart);
  return data || [];
}

export async function fetchBranchInvoiceSales(companyId: string) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { data } = await supabase.from('invoices').select('subtotal, customer_name').eq('company_id', companyId).eq('invoice_type', 'sales').gte('invoice_date', monthStart);
  return data || [];
}

export async function fetchAvailableCars(companyId: string) {
  const { data } = await supabase.from('cars').select('id, status, purchase_price').eq('company_id', companyId).eq('status', 'available');
  return data || [];
}
