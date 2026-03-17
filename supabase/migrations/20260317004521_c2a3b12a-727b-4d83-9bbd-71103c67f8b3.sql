-- Remove duplicate and conflicting journal entry triggers
-- The JS service (approveInvoiceWithJournal) already handles journal creation properly
DROP TRIGGER IF EXISTS create_invoice_journal_entry_trigger ON public.invoices;
DROP TRIGGER IF EXISTS trg_create_invoice_journal_entry ON public.invoices;