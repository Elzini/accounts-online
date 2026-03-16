
-- Reset existing invoices to draft first, then set back to issued to trigger journal entry creation
UPDATE public.invoices SET status = 'draft' WHERE id IN ('857a2252-02d8-48ee-89dc-ab1eef08b247', '700f6935-31ac-49b2-85f1-063d99cd140a') AND status = 'issued';
UPDATE public.invoices SET status = 'issued' WHERE id IN ('857a2252-02d8-48ee-89dc-ab1eef08b247', '700f6935-31ac-49b2-85f1-063d99cd140a') AND status = 'draft';
