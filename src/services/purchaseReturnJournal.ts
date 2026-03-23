/**
 * Purchase Return Journal Entry Service
 * Uses ServiceContainer for journal entries and account resolution.
 */

import { supabase } from '@/hooks/modules/useMiscServices';
import { getInitializedContainer } from '@/core/engine/serviceContainer';

export async function createPurchaseReturnJournal(noteId: string): Promise<void> {
  const { data: noteData, error: noteError } = await supabase
    .from('credit_debit_notes').select('*').eq('id', noteId).single();
  if (noteError || !noteData) throw noteError || new Error('Return note not found');

  const companyId = noteData.company_id;
  const container = await getInitializedContainer(companyId);
  const { journal, resolver } = container;

  const existing = await journal.existsForReference(noteId, ['purchase_return']);
  if (existing) return;

  const subtotal = (Number(noteData.total_amount) || 0) - (Number(noteData.tax_amount) || 0);
  const vatAmount = Number(noteData.tax_amount) || 0;
  const total = Number(noteData.total_amount) || 0;
  if (total <= 0) return;

  // 2. Check accounting settings
  const { data: settings } = await supabase
    .from('company_accounting_settings').select('*').eq('company_id', companyId).maybeSingle();
  if (settings?.auto_journal_entries_enabled === false || settings?.auto_purchase_entries === false) return;

  // 3. Resolve accounts via ServiceContainer's resolver
  const expenseAccount = resolver.resolveFlexible(
    settings?.purchase_inventory_account_id || null, 'purchase_expense', '1301', '5101'
  );
  const vatInputAccount = resolver.resolveFlexible(
    settings?.vat_recoverable_account_id || null, 'vat_input', '1108', '210402', '21042'
  );

  let debitAccount: { id: string; code: string; name: string } | null = null;
  if (noteData.related_invoice_id) {
    const { data: originalInvoice } = await supabase
      .from('invoices').select('payment_account_id, supplier_id').eq('id', noteData.related_invoice_id).maybeSingle();
    if (originalInvoice?.payment_account_id) debitAccount = resolver.resolveFlexible(originalInvoice.payment_account_id, null);
    if (!debitAccount && originalInvoice?.supplier_id) {
      const { data: supplier } = await supabase.from('suppliers').select('name').eq('id', originalInvoice.supplier_id).maybeSingle();
      if (supplier?.name) {
        const subAcc = resolver.findByNameUnderCode(supplier.name, '2101');
        if (subAcc) debitAccount = subAcc;
      }
    }
  }
  if (!debitAccount) debitAccount = resolver.resolveFlexible(settings?.suppliers_account_id || null, 'suppliers', '2101');
  if (!expenseAccount || !debitAccount) { console.error('Missing accounts for purchase return journal entry'); return; }

  // 4. Build lines
  const noteDesc = noteData.reason || `مرتجع مشتريات ${noteData.note_number}`;
  const lines: Array<{ account_id: string; description: string; debit: number; credit: number }> = [
    { account_id: debitAccount.id, description: `${debitAccount.name} - مرتجع ${noteData.note_number}`, debit: total, credit: 0 },
    { account_id: expenseAccount.id, description: `مرتجع مشتريات - ${noteData.note_number}`, debit: 0, credit: subtotal },
  ];
  if (vatAmount > 0 && vatInputAccount) {
    lines.push({ account_id: vatInputAccount.id, description: `ضريبة مرتجع مشتريات - ${noteData.note_number}`, debit: 0, credit: vatAmount });
  }

  // 5. Create via ServiceContainer
  await journal.createEntry({
    company_id: companyId,
    fiscal_year_id: noteData.fiscal_year_id || '',
    entry_date: noteData.note_date || new Date().toISOString().split('T')[0],
    description: noteDesc,
    reference_type: 'purchase_return',
    reference_id: noteId,
    is_posted: true,
    lines,
  });
}
