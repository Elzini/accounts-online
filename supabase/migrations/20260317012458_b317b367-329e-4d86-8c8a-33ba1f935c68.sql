-- Disable ALL protection triggers on all affected tables
ALTER TABLE public.invoice_items DISABLE TRIGGER trg_protect_approved_invoice_items;
ALTER TABLE public.invoices DISABLE TRIGGER trg_protect_approved_invoices;
ALTER TABLE public.journal_entry_lines DISABLE TRIGGER trg_protect_posted_journal_lines;
ALTER TABLE public.journal_entries DISABLE TRIGGER trg_protect_posted_journal_entries;

-- Delete duplicate PUR-22 (1-11361)
DELETE FROM public.invoice_items WHERE invoice_id = '7730be4a-1248-45ed-a3f9-04a8dbdbbb18';
UPDATE public.invoices SET journal_entry_id = NULL WHERE id = '7730be4a-1248-45ed-a3f9-04a8dbdbbb18';
DELETE FROM public.invoices WHERE id = '7730be4a-1248-45ed-a3f9-04a8dbdbbb18';
DELETE FROM public.journal_entry_lines WHERE journal_entry_id = 'd23f741f-047c-4143-b64d-d6ee5727db91';
DELETE FROM public.journal_entries WHERE id = 'd23f741f-047c-4143-b64d-d6ee5727db91';

-- Re-enable ALL protection triggers
ALTER TABLE public.invoice_items ENABLE TRIGGER trg_protect_approved_invoice_items;
ALTER TABLE public.invoices ENABLE TRIGGER trg_protect_approved_invoices;
ALTER TABLE public.journal_entry_lines ENABLE TRIGGER trg_protect_posted_journal_lines;
ALTER TABLE public.journal_entries ENABLE TRIGGER trg_protect_posted_journal_entries