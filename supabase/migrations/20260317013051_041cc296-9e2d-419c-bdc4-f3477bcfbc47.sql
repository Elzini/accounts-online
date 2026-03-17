-- Disable ALL protection triggers
ALTER TABLE public.invoice_items DISABLE TRIGGER trg_protect_approved_invoice_items;
ALTER TABLE public.invoices DISABLE TRIGGER trg_protect_approved_invoices;
ALTER TABLE public.journal_entry_lines DISABLE TRIGGER trg_protect_posted_journal_lines;
ALTER TABLE public.journal_entries DISABLE TRIGGER trg_protect_posted_journal_entries;

-- 1. Fix PUR-24 (1-11254): total 2612.20 → 2512.20
UPDATE public.invoices SET total = 2512.20 WHERE id = 'b1d56680-6a81-4fc5-a21c-bf41fe134f2a';

-- 2. Fix PUR-25 (1-11313): total 2496.04 → 2495.04
UPDATE public.invoices SET total = 2495.04 WHERE id = 'af8653af-4643-4f23-9372-6c7b436cc707';

-- 3. Fix PUR-21: change supplier_invoice_number from 1-2053 to 1_2035
UPDATE public.invoices SET supplier_invoice_number = '1_2035' WHERE id = '51904a38-6f42-45fe-a672-3ece27632f3f';

-- 4. Convert PUR-8 (1-2307) to return: set negative values
UPDATE public.invoices SET subtotal = -2160.00, vat_amount = -324.00, total = -2484.00 WHERE id = '3efffb0c-c929-4453-ab19-4956c14e32c8';

-- 5. Convert PUR-21 (1_2035) to return: set negative values  
UPDATE public.invoices SET subtotal = -1300.00, vat_amount = -195.00, total = -1495.00 WHERE id = '51904a38-6f42-45fe-a672-3ece27632f3f';

-- 6. Convert PUR-33 (1-2010) to return: set negative values
UPDATE public.invoices SET subtotal = -252.20, vat_amount = -37.83, total = -290.03 WHERE id = '46271623-3945-403b-a862-83b0c1498648';

-- Re-enable ALL protection triggers
ALTER TABLE public.invoice_items ENABLE TRIGGER trg_protect_approved_invoice_items;
ALTER TABLE public.invoices ENABLE TRIGGER trg_protect_approved_invoices;
ALTER TABLE public.journal_entry_lines ENABLE TRIGGER trg_protect_posted_journal_lines;
ALTER TABLE public.journal_entries ENABLE TRIGGER trg_protect_posted_journal_entries