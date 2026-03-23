/**
 * Returns DB Service Layer
 * Uses ServiceContainer for journal entry operations.
 */
import { supabase } from '@/integrations/supabase/client';
import { getServiceContainer } from '@/core/engine/serviceContainer';

// ── Sales Returns ──
export async function deleteSaleAndRelated(saleId: string, fullInvoice: boolean, carIds: string[]) {
  // Restore cars
  for (const carId of carIds) {
    if (carId) {
      const { error } = await supabase.from('cars').update({ status: 'available' }).eq('id', carId);
      if (error) throw error;
    }
  }
  // Get company_id from sale
  const { data: sale } = await supabase.from('sales').select('company_id').eq('id', saleId).maybeSingle();
  if (sale?.company_id) {
    const { journal } = getServiceContainer(sale.company_id);
    await journal.deleteByReference(saleId, 'sale');
  }
  if (fullInvoice) {
    await supabase.from('sale_items').delete().eq('sale_id', saleId);
    await supabase.from('sales').delete().eq('id', saleId);
  }
}

export async function deleteInvoiceAndRelated(invoiceId: string, fullInvoice: boolean) {
  const { data: invoice } = await supabase.from('invoices').select('company_id').eq('id', invoiceId).maybeSingle();
  if (invoice?.company_id) {
    const { journal } = getServiceContainer(invoice.company_id);
    await journal.deleteByReference(invoiceId, 'invoice');
  }
  if (fullInvoice) {
    await supabase.from('invoices').delete().eq('id', invoiceId);
  }
}

export async function createCreditDebitNote(params: {
  companyId: string; noteNumber: string; noteType: 'credit' | 'debit';
  noteDate: string; totalAmount: number; taxAmount?: number;
  supplierId?: string | null; relatedInvoiceId?: string | null;
  reason: string; status?: string;
}) {
  const { error } = await supabase.from('credit_debit_notes').insert({
    company_id: params.companyId, note_number: params.noteNumber,
    note_type: params.noteType, note_date: params.noteDate,
    total_amount: params.totalAmount, tax_amount: params.taxAmount,
    supplier_id: params.supplierId || null,
    related_invoice_id: params.relatedInvoiceId || null,
    reason: params.reason, status: params.status || 'approved',
  });
  if (error) throw error;

  const { data: inserted } = await supabase
    .from('credit_debit_notes').select('id')
    .eq('company_id', params.companyId).eq('note_number', params.noteNumber).single();
  return inserted;
}

export async function insertNoteLines(noteId: string, lines: Array<{ item_name: string; quantity: number; unit_price: number; notes?: string }>) {
  if (lines.length === 0) return;
  const rows = lines.map(l => ({ note_id: noteId, item_name: l.item_name, quantity: l.quantity, unit_price: l.unit_price, notes: l.notes }));
  await supabase.from('credit_debit_note_lines').insert(rows);
}

export async function deleteCreditDebitNote(id: string) {
  const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id);
  if (error) throw error;
}

export async function updateCreditDebitNote(id: string, data: { note_date?: string; total_amount?: number; tax_amount?: number; reason?: string }) {
  const { error } = await supabase.from('credit_debit_notes').update(data).eq('id', id);
  if (error) throw error;
}

// ── Purchase Returns ──
export async function markCarsAsReturned(carIds: string[]) {
  for (const carId of carIds) {
    if (carId) {
      const { error } = await supabase.from('cars').update({ status: 'returned' }).eq('id', carId);
      if (error) throw error;
    }
  }
}

export async function deletePurchaseJournalEntries(batchId: string) {
  // Need company_id for ServiceContainer - fetch from purchase_batches
  const { data: batch } = await supabase.from('purchase_batches').select('company_id').eq('id', batchId).maybeSingle();
  if (batch?.company_id) {
    const { journal } = getServiceContainer(batch.company_id);
    await journal.deleteByReference(batchId, 'purchase');
  }
}
