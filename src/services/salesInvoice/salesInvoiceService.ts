/**
 * Sales Invoice - Data Access Service
 * Extracted from useSalesInvoiceData.ts to enforce architectural layers.
 */
import { supabase } from '@/hooks/modules/useMiscServices';

export async function fetchSalesInvoices(companyId: string) {
  const { data } = await supabase.from('invoices')
    .select('*, invoice_items(*)')
    .eq('company_id', companyId).eq('invoice_type', 'sales')
    .order('created_at', { ascending: true });
  return data || [];
}

export async function fetchNextInvoiceNumber(companyId: string): Promise<string> {
  const { count } = await supabase.from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId).eq('invoice_type', 'sales');
  const year = new Date().getFullYear();
  return `INV-${year}-${String((count || 0) + 1).padStart(3, '0')}`;
}

export async function insertSalesInvoice(companyId: string, invoiceData: {
  invoice_number: string; invoice_date: string; customer_name: string;
  customer_id?: string; supplier_id?: string; subtotal: number;
  vat_amount: number; total: number; status: string; invoice_type: 'sales';
  payment_account_id?: string; discount_amount?: number; vat_rate?: number;
  notes?: string; seller_name?: string; amount_paid?: number;
  fiscal_year_id?: string; company_id: string;
}, items: any[]) {
  const { data: invoice, error } = await supabase.from('invoices')
    .insert(invoiceData).select().single();
  if (error) throw error;
  if (items.length > 0 && invoice) {
    const { error: itemsErr } = await supabase.from('invoice_items').insert(
      items.map(item => ({ ...item, invoice_id: invoice.id }))
    );
    if (itemsErr) throw itemsErr;
  }
  return invoice;
}

export async function updateSalesInvoice(invoiceId: string, updates: Record<string, any>, items?: any[]) {
  const { error } = await supabase.from('invoices').update(updates).eq('id', invoiceId);
  if (error) throw error;
  if (items) {
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    if (items.length > 0) {
      const { error: itemsErr } = await supabase.from('invoice_items').insert(
        items.map(item => ({ ...item, invoice_id: invoiceId }))
      );
      if (itemsErr) throw itemsErr;
    }
  }
}

export async function deleteSalesInvoice(invoiceId: string) {
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
  if (error) throw error;
}
