
-- Create sub-account for مؤسسة غصون التجارية under 2101
INSERT INTO public.account_categories (company_id, code, name, type, parent_id, is_system)
VALUES (
  'be98c761-377f-41c0-ac43-27d2707295ca',
  '210101',
  'مؤسسة غصون التجارية',
  'liability',
  'dcf042ba-295d-48d7-9cd5-f7785c74a3bd',
  false
);

-- Update all purchase invoice journal entry lines to use the new account
DO $$
DECLARE
  v_new_account_id UUID;
BEGIN
  SELECT id INTO v_new_account_id FROM public.account_categories
  WHERE company_id = 'be98c761-377f-41c0-ac43-27d2707295ca' AND code = '210101';

  ALTER TABLE public.journal_entry_lines DISABLE TRIGGER trg_protect_posted_journal_lines;

  UPDATE public.journal_entry_lines jel
  SET account_id = v_new_account_id
  FROM public.journal_entries je
  JOIN public.invoices i ON i.id = je.reference_id
  WHERE jel.journal_entry_id = je.id
    AND je.company_id = 'be98c761-377f-41c0-ac43-27d2707295ca'
    AND je.reference_type = 'invoice_purchase'
    AND i.invoice_number IN (
      'PUR-1','PUR-2','PUR-3','PUR-4','PUR-5','PUR-6','PUR-7','PUR-8',
      'PUR-9','PUR-10','PUR-11','PUR-12','PUR-13','PUR-14','PUR-15','PUR-16',
      'PUR-17','PUR-18','PUR-19','PUR-20','PUR-21','PUR-22','PUR-23','PUR-24',
      'PUR-25','PUR-26','PUR-27','PUR-28','PUR-29','PUR-30','PUR-31','PUR-32'
    )
    AND jel.account_id = 'dcf042ba-295d-48d7-9cd5-f7785c74a3bd';

  ALTER TABLE public.journal_entry_lines ENABLE TRIGGER trg_protect_posted_journal_lines;
END;
$$;
