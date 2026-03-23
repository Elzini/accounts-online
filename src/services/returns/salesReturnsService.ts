/**
 * Sales Returns - Data Access Service
 * Extracted from useSalesReturns.ts to enforce architectural layers.
 */
import { supabase } from '@/hooks/modules/useMiscServices';

export async function fetchAvailableInvoicesForReturn(companyId: string, isCarDealership: boolean) {
  if (isCarDealership) {
    const { data, error } = await supabase.from('sales')
      .select('id, sale_number, sale_date, sale_price, customer:customers(name)')
      .eq('company_id', companyId).order('sale_number', { ascending: false }).limit(200);
    if (error) throw error;
    return (data || []).map((s: any) => ({ id: s.id, number: s.sale_number, date: s.sale_date, total: s.sale_price, customerName: s.customer?.name || '', source: 'sales' as const }));
  } else {
    const { data, error } = await supabase.from('invoices')
      .select('id, invoice_number, invoice_date, total, customer_name')
      .eq('company_id', companyId).eq('invoice_type', 'sales').order('invoice_number', { ascending: false }).limit(200);
    if (error) throw error;
    return (data || []).map((inv: any) => ({ id: inv.id, number: inv.invoice_number, date: inv.invoice_date, total: inv.total, customerName: inv.customer_name || '', source: 'invoices' as const }));
  }
}

export async function fetchSalesReturns(companyId: string) {
  const { data, error } = await supabase.from('credit_debit_notes')
    .select('*').eq('company_id', companyId).eq('note_type', 'credit')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function searchSaleByNumber(companyId: string, saleNumber: number) {
  const { data, error } = await supabase.from('sales')
    .select('*, car:cars(*), customer:customers(name, phone), sale_items:sale_items(*, car:cars(*))')
    .eq('company_id', companyId).eq('sale_number', saleNumber).single();
  if (error) throw error;
  return data;
}

export async function searchInvoiceByNumber(companyId: string, invoiceNumber: string) {
  const { data, error } = await supabase.from('invoices')
    .select('*').eq('company_id', companyId).eq('invoice_type', 'sales')
    .eq('invoice_number', invoiceNumber.trim()).single();
  if (error) throw error;
  return data;
}

export async function processCarReturn(items: Array<{ car_id: string }>) {
  for (const item of items) {
    if (item.car_id) {
      const { error } = await supabase.from('cars').update({ status: 'available' }).eq('id', item.car_id);
      if (error) throw error;
    }
  }
}

export async function deleteSaleWithJournal(saleId: string, fullInvoice: boolean) {
  await supabase.from('journal_entries').delete().eq('reference_type', 'sale').eq('reference_id', saleId);
  if (fullInvoice) {
    await supabase.from('sale_items').delete().eq('sale_id', saleId);
    await supabase.from('sales').delete().eq('id', saleId);
  }
}

export async function deleteInvoiceWithJournal(invoiceId: string, fullInvoice: boolean) {
  await supabase.from('journal_entries').delete().eq('reference_type', 'invoice').eq('reference_id', invoiceId);
  if (fullInvoice) {
    await supabase.from('invoices').delete().eq('id', invoiceId);
  }
}

export async function insertCreditNote(companyId: string, noteData: {
  note_number: string; note_date: string; total_amount: number; reason: string;
}) {
  const { error } = await supabase.from('credit_debit_notes').insert({
    company_id: companyId, note_type: 'credit', status: 'approved', ...noteData,
  });
  if (error) throw error;
}

export async function deleteCreditNote(id: string) {
  const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id);
  if (error) throw error;
}
