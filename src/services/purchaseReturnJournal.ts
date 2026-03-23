import { supabase } from '@/hooks/modules/useMiscServices';

/**
 * Create a reverse journal entry for an approved purchase return (debit note).
 * This reverses the original purchase entry:
 *   Debit: Supplier/Payment account (total) 
 *   Credit: Expense/Inventory account (subtotal)
 *   Credit: VAT Input account (vat_amount)
 */
export async function createPurchaseReturnJournal(noteId: string): Promise<void> {
  // 0. Check for existing journal entry
  const { data: existing } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('reference_id', noteId)
    .eq('reference_type', 'purchase_return')
    .limit(1);

  if (existing && existing.length > 0) return;

  // 1. Fetch the debit note
  const { data: note, error: noteError } = await supabase
    .from('credit_debit_notes')
    .select('*')
    .eq('id', noteId)
    .single();

  if (noteError || !note) throw noteError || new Error('Return note not found');

  const companyId = note.company_id;
  const subtotal = (Number(note.total_amount) || 0) - (Number(note.tax_amount) || 0);
  const vatAmount = Number(note.tax_amount) || 0;
  const total = Number(note.total_amount) || 0;

  if (total <= 0) return;

  // 2. Fetch accounting settings
  const { data: settings } = await supabase
    .from('company_accounting_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  if (settings?.auto_journal_entries_enabled === false || settings?.auto_purchase_entries === false) {
    return;
  }

  // 3. Find accounts
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('id, code, name')
    .eq('company_id', companyId);

  const findAccount = (id: string | null, ...fallbackCodes: string[]) => {
    if (id) {
      const acc = accounts?.find(a => a.id === id);
      if (acc) return acc;
    }
    for (const code of fallbackCodes) {
      const acc = accounts?.find(a => a.code === code);
      if (acc) return acc;
    }
    return null;
  };

  // Expense/Inventory account (same as original purchase debit)
  const expenseAccount = findAccount(
    settings?.purchase_inventory_account_id || null,
    '1301', '5101'
  );

  // VAT Input account
  const vatInputAccount = findAccount(
    settings?.vat_recoverable_account_id || null,
    '1108', '210402', '21042'
  );

  // Determine debit account: use the same payment account from the original invoice
  let debitAccount: { id: string; code: string; name: string } | null = null;
  
  if (note.related_invoice_id) {
    const { data: originalInvoice } = await supabase
      .from('invoices')
      .select('payment_account_id, supplier_id')
      .eq('id', note.related_invoice_id)
      .maybeSingle();

    if (originalInvoice?.payment_account_id) {
      debitAccount = findAccount(originalInvoice.payment_account_id);
    }
    
    if (!debitAccount && originalInvoice?.supplier_id) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', originalInvoice.supplier_id)
        .maybeSingle();
      if (supplier?.name) {
        const subAcc = accounts?.find(a => a.code?.startsWith('2101') && a.name === supplier.name);
        if (subAcc) debitAccount = subAcc;
      }
    }
  }

  if (!debitAccount) {
    debitAccount = findAccount(settings?.suppliers_account_id || null, '2101');
  }

  if (!expenseAccount || !debitAccount) {
    console.error('Missing accounts for purchase return journal entry');
    return;
  }

  // 4. Build journal lines (reverse of purchase)
  const journalLines: Array<{ account_id: string; description: string; debit: number; credit: number }> = [];
  const noteDesc = note.reason || `مرتجع مشتريات ${note.note_number}`;

  // Debit: Payment/Supplier account (total)
  journalLines.push({
    account_id: debitAccount.id,
    description: `${debitAccount.name} - مرتجع ${note.note_number}`,
    debit: total,
    credit: 0,
  });

  // Credit: Expense/Inventory account (subtotal)
  journalLines.push({
    account_id: expenseAccount.id,
    description: `مرتجع مشتريات - ${note.note_number}`,
    debit: 0,
    credit: subtotal,
  });

  // Credit: VAT Input account (if VAT exists)
  if (vatAmount > 0 && vatInputAccount) {
    journalLines.push({
      account_id: vatInputAccount.id,
      description: `ضريبة مرتجع مشتريات - ${note.note_number}`,
      debit: 0,
      credit: vatAmount,
    });
  }

  // 5. Create journal entry
  const totalDebit = journalLines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = journalLines.reduce((s, l) => s + l.credit, 0);

  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      entry_date: note.note_date || new Date().toISOString().split('T')[0],
      description: noteDesc,
      reference_type: 'purchase_return',
      reference_id: noteId,
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_posted: true,
      fiscal_year_id: note.fiscal_year_id || null,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  // 6. Insert journal lines
  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(journalLines.map(line => ({
      journal_entry_id: entry.id,
      account_id: line.account_id,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
      cost_center_id: null,
    })));

  if (linesError) throw linesError;
}
