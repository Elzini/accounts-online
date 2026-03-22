import { supabase } from '@/integrations/supabase/client';

/**
 * Approve a purchase/sales invoice and auto-create journal entry with proper VAT posting
 */
export async function approveInvoiceWithJournal(invoiceId: string): Promise<void> {
  // 0. Check if journal entry already exists for this invoice — prevent duplicates
  const { data: existingEntries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('reference_id', invoiceId)
    .in('reference_type', ['invoice_purchase', 'invoice_sale'])
    .limit(1);

  if (existingEntries && existingEntries.length > 0) {
    // Journal entry already exists — just update status and return
    await supabase.from('invoices').update({ status: 'issued', journal_entry_id: existingEntries[0].id }).eq('id', invoiceId);
    return;
  }

  // 1. Fetch full invoice data
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', invoiceId)
    .single();

  if (invError || !invoice) throw invError || new Error('Invoice not found');

  const companyId = invoice.company_id;
  const isPurchase = invoice.invoice_type === 'purchase';
  const isSales = invoice.invoice_type === 'sales';

  // 2. Fetch accounting settings
  const { data: settings } = await supabase
    .from('company_accounting_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  // Check if auto entries are enabled
  if (settings?.auto_journal_entries_enabled === false) {
    // Just update status without journal entry
    await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
    return;
  }

  if (isPurchase && settings?.auto_purchase_entries === false) {
    await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
    return;
  }

  if (isSales && settings?.auto_sales_entries === false) {
    await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
    return;
  }

  const subtotal = Number(invoice.subtotal) || 0;
  const vatAmount = Number(invoice.vat_amount) || 0;
  const total = Number(invoice.total) || subtotal + vatAmount;

  if (total <= 0) {
    await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
    return;
  }

  // 3. Find the necessary accounts - use account_mappings first, then settings, then code fallbacks
  const [accountsRes, mappingsRes] = await Promise.all([
    supabase.from('account_categories').select('id, code, name').eq('company_id', companyId),
    supabase.from('account_mappings').select('mapping_key, account_id').eq('company_id', companyId).eq('is_active', true),
  ]);
  const accounts = accountsRes.data;
  const mappings = mappingsRes.data;

  const getMappedAccountId = (key: string): string | null => {
    const mapping = mappings?.find(m => m.mapping_key === key);
    return mapping?.account_id || null;
  };

  const findAccount = (id: string | null, mappingKey: string | null, ...fallbackCodes: string[]) => {
    // Priority 1: explicit ID from settings
    if (id) {
      const acc = accounts?.find(a => a.id === id);
      if (acc) return acc;
    }
    // Priority 2: account_mappings table
    if (mappingKey) {
      const mappedId = getMappedAccountId(mappingKey);
      if (mappedId) {
        const acc = accounts?.find(a => a.id === mappedId);
        if (acc) return acc;
      }
    }
    // Priority 3: fallback codes
    for (const code of fallbackCodes) {
      const acc = accounts?.find(a => a.code === code);
      if (acc) return acc;
    }
    return null;
  };

  // Find supplier sub-account
  const findSupplierAccount = async () => {
    if (invoice.supplier_id) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', invoice.supplier_id)
        .maybeSingle();
      if (supplier?.name) {
        const subAcc = accounts?.find(a => a.code?.startsWith('2101') && a.name === supplier.name);
        if (subAcc) return subAcc;
      }
    }
    return findAccount(settings?.suppliers_account_id || null, 'suppliers', '2101');
  };

  let journalLines: Array<{ account_id: string; description: string; debit: number; credit: number; cost_center_id?: string | null }> = [];
  let description = '';

  if (isPurchase) {
    // Purchase invoice journal entry:
    // Debit: Expense/Inventory account (subtotal)
    // Debit: VAT Input account (vat_amount)
    // Credit: Based on payment choice (supplier/bank/partner account)

    const expenseAccount = findAccount(
      settings?.purchase_inventory_account_id || null,
      'purchase_expense',
      '1301', '5101',
    );

    const vatInputAccount = findAccount(
      settings?.vat_recoverable_account_id || null,
      'vat_input',
      '1108', '210402', '21042',
    );

    // Determine credit account based on payment_account_id selection
    let creditAccount: { id: string; code: string; name: string } | null = null;
    
    if (invoice.payment_account_id) {
      // User selected a specific payment account (bank, partner, supplier, etc.)
      creditAccount = findAccount(invoice.payment_account_id, null);
    }
    
    // Fallback to supplier account if no payment account selected (آجل - on credit)
    if (!creditAccount) {
      creditAccount = await findSupplierAccount();
    }

    if (!expenseAccount || !creditAccount) {
      console.error('Missing accounts for purchase journal entry');
      await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
      return;
    }

    description = `فاتورة شراء رقم ${invoice.invoice_number} - ${invoice.customer_name || ''}`;

    // Debit: expense account (subtotal)
    journalLines.push({
      account_id: expenseAccount.id,
      description: `مشتريات - ${invoice.customer_name || invoice.invoice_number}`,
      debit: subtotal,
      credit: 0,
    });

    // Debit: VAT input account (if VAT exists and account found)
    if (vatAmount > 0 && vatInputAccount) {
      journalLines.push({
        account_id: vatInputAccount.id,
        description: `ضريبة مشتريات - ${invoice.invoice_number}`,
        debit: vatAmount,
        credit: 0,
      });
    }

    // Credit: chosen payment account (supplier/bank/partner)
    journalLines.push({
      account_id: creditAccount.id,
      description: `${creditAccount.name} - ${invoice.customer_name || invoice.invoice_number}`,
      debit: 0,
      credit: vatAmount > 0 && vatInputAccount ? subtotal + vatAmount : subtotal,
    });

  } else if (isSales) {
    // Sales invoice journal entry:
    // Debit: Customer/Cash account (total)
    // Credit: Revenue account (subtotal)
    // Credit: VAT Output account (vat_amount)

    const cashAccount = findAccount(
      settings?.sales_cash_account_id || null,
      'sales_cash',
      '1101', '1201',
    );

    const revenueAccount = findAccount(
      settings?.sales_revenue_account_id || null,
      '4101', // إيرادات
    );

    const vatOutputAccount = findAccount(
      settings?.vat_payable_account_id || null,
      '210401', // ضريبة مبيعات مستحقة
      '21041',
    );

    if (!cashAccount || !revenueAccount) {
      console.error('Missing accounts for sales journal entry');
      await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
      return;
    }

    description = `فاتورة بيع رقم ${invoice.invoice_number} - ${invoice.customer_name || ''}`;

    // Debit: cash/customer account (total)
    journalLines.push({
      account_id: cashAccount.id,
      description: `مبيعات - ${invoice.customer_name || invoice.invoice_number}`,
      debit: total,
      credit: 0,
    });

    // Credit: revenue account (subtotal)
    journalLines.push({
      account_id: revenueAccount.id,
      description: `إيراد - ${invoice.invoice_number}`,
      debit: 0,
      credit: subtotal,
    });

    // Credit: VAT output account (if VAT exists)
    if (vatAmount > 0 && vatOutputAccount) {
      journalLines.push({
        account_id: vatOutputAccount.id,
        description: `ضريبة مبيعات - ${invoice.invoice_number}`,
        debit: 0,
        credit: vatAmount,
      });
    }
  }

  if (journalLines.length === 0) {
    await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
    return;
  }

  // 4. Create journal entry
  const totalDebit = journalLines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = journalLines.reduce((s, l) => s + l.credit, 0);

  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      entry_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
      description,
      reference_type: isPurchase ? 'invoice_purchase' : 'invoice_sale',
      reference_id: invoiceId,
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_posted: true,
      fiscal_year_id: invoice.fiscal_year_id || null,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  // 5. Insert journal lines
  const linesWithEntryId = journalLines.map(line => ({
    journal_entry_id: entry.id,
    account_id: line.account_id,
    description: line.description,
    debit: line.debit,
    credit: line.credit,
    cost_center_id: null,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(linesWithEntryId);

  if (linesError) throw linesError;

  // 6. Update invoice status and link journal entry
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ 
      status: 'issued',
      journal_entry_id: entry.id,
    })
    .eq('id', invoiceId);

  if (updateError) throw updateError;
}
