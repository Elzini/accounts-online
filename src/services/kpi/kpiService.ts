/**
 * KPI Dashboard - Data Access Service
 * Extracted from ExecutiveKPIDashboard.tsx to enforce architectural layers.
 */
import { supabase } from '@/hooks/modules/useReportsServices';

export async function fetchKPITargets(companyId: string) {
  const { data } = await supabase.from('app_settings')
    .select('value').eq('company_id', companyId).eq('key', 'kpi_targets').maybeSingle();
  return data?.value ? JSON.parse(data.value) : null;
}

export async function saveKPITargets(companyId: string, targets: any[]) {
  const { error } = await supabase.from('app_settings').upsert({
    company_id: companyId, key: 'kpi_targets', value: JSON.stringify(targets),
  }, { onConflict: 'company_id,key' });
  if (error) throw error;
}

export async function fetchCarKPIMetrics(companyId: string, monthStart: string) {
  const [salesRes, carsRes, customersRes, expensesRes] = await Promise.all([
    supabase.from('sales').select('sale_price, purchase_price, sale_date, customer_id').eq('company_id', companyId).gte('sale_date', monthStart),
    supabase.from('cars').select('id, status, purchase_date').eq('company_id', companyId),
    supabase.from('customers').select('id, created_at').eq('company_id', companyId).gte('created_at', monthStart),
    supabase.from('expenses').select('amount, expense_date').eq('company_id', companyId).gte('expense_date', monthStart),
  ]);
  return { sales: salesRes.data || [], cars: carsRes.data || [], customers: customersRes.data || [], expenses: expensesRes.data || [] };
}

export async function fetchInvoiceKPIMetrics(companyId: string, monthStart: string) {
  const [salesRes, customersRes, expensesRes, purchasesRes] = await Promise.all([
    supabase.from('invoices').select('subtotal, invoice_date').eq('company_id', companyId).eq('invoice_type', 'sales').gte('invoice_date', monthStart),
    supabase.from('customers').select('id, created_at').eq('company_id', companyId).gte('created_at', monthStart),
    supabase.from('expenses').select('amount, expense_date').eq('company_id', companyId).gte('expense_date', monthStart),
    supabase.from('invoices').select('subtotal').eq('company_id', companyId).eq('invoice_type', 'purchase').gte('invoice_date', monthStart),
  ]);
  return { sales: salesRes.data || [], customers: customersRes.data || [], expenses: expensesRes.data || [], purchases: purchasesRes.data || [] };
}
