/**
 * Purchase Returns - Data Access Service
 * Extracted from usePurchaseReturns.ts to enforce architectural layers.
 */
import { supabase } from '@/hooks/modules/useMiscServices';

export async function fetchPurchaseReturns(companyId: string) {
  const { data, error } = await supabase.from('credit_debit_notes')
    .select('*').eq('company_id', companyId).eq('note_type', 'debit')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function searchCarByInventoryNumber(companyId: string, inventoryNumber: number) {
  const { data: car, error } = await supabase.from('cars')
    .select('id, inventory_number, name, model, color, chassis_number, purchase_price, purchase_date, status, batch_id, supplier_id')
    .eq('company_id', companyId).eq('inventory_number', inventoryNumber).single();
  if (error) throw error;
  return car;
}

export async function fetchSupplierName(supplierId: string): Promise<string> {
  const { data } = await supabase.from('suppliers').select('name').eq('id', supplierId).single();
  return data?.name || '-';
}

export async function searchPurchaseInvoice(companyId: string, searchQuery: string) {
  const { data, error } = await (supabase as any).from('invoices')
    .select('*, invoice_items(*), supplier:suppliers!invoices_supplier_id_fkey(name)')
    .eq('company_id', companyId).eq('invoice_type', 'purchase')
    .or(`invoice_number.eq.${searchQuery},invoice_number.ilike.%${searchQuery}%`)
    .limit(1).single();
  if (!error && data) return data;

  // Fallback to ilike
  const { data: d2, error: e2 } = await (supabase as any).from('invoices')
    .select('*, invoice_items(*), supplier:suppliers!invoices_supplier_id_fkey(name)')
    .eq('company_id', companyId).eq('invoice_type', 'purchase')
    .ilike('invoice_number', `%${searchQuery}%`).limit(1).single();
  if (e2) throw e2;
  return d2;
}

export async function markCarReturned(carId: string) {
  const { error } = await supabase.from('cars').update({ status: 'returned' }).eq('id', carId);
  if (error) throw error;
}

export async function deleteJournalByBatch(batchId: string) {
  await supabase.from('journal_entries').delete().eq('reference_type', 'purchase').eq('reference_id', batchId);
}

export async function insertDebitNote(companyId: string, noteData: {
  note_number: string; note_date: string; total_amount: number; tax_amount: number;
  supplier_id: string | null; related_invoice_id: string | null; reason: string;
}) {
  const { error } = await supabase.from('credit_debit_notes').insert({
    company_id: companyId, note_type: 'debit', status: 'approved', ...noteData,
  });
  if (error) throw error;
}

export async function fetchInsertedNote(companyId: string, noteNumber: string) {
  const { data } = await supabase.from('credit_debit_notes')
    .select('id').eq('company_id', companyId).eq('note_number', noteNumber).single();
  return data;
}

export async function insertNoteLines(noteId: string, lines: Array<{ item_name: string; quantity: number; unit_price: number; notes: string }>) {
  await supabase.from('credit_debit_note_lines').insert(lines.map(l => ({ note_id: noteId, ...l })));
}

export async function deleteDebitNote(id: string) {
  const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id);
  if (error) throw error;
}

export async function updateDebitNote(id: string, data: { note_date: string; total_amount: number; tax_amount: number; reason: string }) {
  const { error } = await supabase.from('credit_debit_notes').update(data).eq('id', id);
  if (error) throw error;
}
