import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchSalesForForecast(hasCarInventory: boolean) {
  const companyId = await requireCompanyId();
  if (hasCarInventory) {
    const { data } = await supabase.from('sales')
      .select('sale_date, sale_price, purchase_price')
      .eq('company_id', companyId)
      .order('sale_date', { ascending: true });
    return data || [];
  } else {
    const { data } = await supabase.from('invoices')
      .select('invoice_date, subtotal, total')
      .eq('company_id', companyId).eq('invoice_type', 'sales').neq('status', 'draft')
      .order('invoice_date', { ascending: true });
    return (data || []).map((inv: any) => ({
      sale_date: inv.invoice_date,
      sale_price: Number(inv.total) || 0,
      purchase_price: 0,
    }));
  }
}

export async function invokeSalesForecastAI(body: any) {
  const { data, error } = await supabase.functions.invoke('ai-sales-forecast', { body });
  if (error) throw error;
  return data;
}
