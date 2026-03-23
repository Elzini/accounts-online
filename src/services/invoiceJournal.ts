/**
 * Invoice Journal Entry Service
 * 
 * Thin facade that delegates to the Core Engine's InvoicePostingEngine.
 * Kept for backward compatibility with existing imports.
 */

import { InvoicePostingEngine } from '@/core/engine/invoicePostingEngine';

/**
 * Approve a purchase/sales invoice and auto-create journal entry with proper VAT posting.
 * This is the single entry point used by SalesInvoiceForm and PurchasesTable.
 */
export async function approveInvoiceWithJournal(invoiceId: string): Promise<void> {
  // We need companyId to construct engine — fetch it from the invoice
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('company_id')
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) throw error || new Error('Invoice not found');

  const engine = new InvoicePostingEngine(invoice.company_id);
  await engine.postInvoice(invoiceId);
}
