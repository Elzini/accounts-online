import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchBISales(hasCarInventory: boolean) {
  const companyId = await requireCompanyId();
  if (hasCarInventory) {
    const { data } = await supabase.from('sales').select('sale_date, sale_price, purchase_price, status, customer_id')
      .eq('company_id', companyId).order('sale_date', { ascending: true });
    return data || [];
  }
  const { data } = await supabase.from('invoices').select('invoice_date, subtotal, customer_name, status')
    .eq('company_id', companyId).eq('invoice_type', 'sales').order('invoice_date', { ascending: true });
  return data || [];
}

export async function fetchBICustomers() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('customers').select('id, name, created_at')
    .eq('company_id', companyId);
  return data || [];
}

export async function fetchBICars() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('cars').select('id, status, purchase_price, purchase_date')
    .eq('company_id', companyId);
  return data || [];
}

export async function fetchBIExpenses() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('expenses').select('amount, expense_date, category')
    .eq('company_id', companyId);
  return data || [];
}
