/**
 * Invoice Journal Entry Service
 * 
 * Thin facade that delegates to the ServiceContainer's InvoicePostingEngine.
 * Kept for backward compatibility with existing imports.
 */

import { getServiceContainer } from '@/core/engine/serviceContainer';

/**
 * Approve a purchase/sales invoice and auto-create journal entry with proper VAT posting.
 * This is the single entry point used by SalesInvoiceForm and PurchasesTable.
 */
export async function approveInvoiceWithJournal(invoiceId: string): Promise<void> {
  // We need companyId to construct container — fetch it from the invoice
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('company_id')
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) throw error || new Error('Invoice not found');

  const { invoicePosting } = getServiceContainer(invoice.company_id);
  await invoicePosting.postInvoice(invoiceId);
}
