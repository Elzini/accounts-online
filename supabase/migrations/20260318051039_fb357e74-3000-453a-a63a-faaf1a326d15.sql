
-- Update journal entry lines for all purchase invoices (PUR-1 to PUR-32) for company افق
-- New structure: Debit تكاليف تطوير (130104) + Debit ضريبة مشتريات (1108) / Credit ذمم دائنة (2101)

DO $$
DECLARE
  v_company_id UUID := 'be98c761-377f-41c0-ac43-27d2707295ca';
  v_cost_account_id UUID := '02a84c20-deb3-4bd7-9d81-89d460afe550';
  v_vat_account_id UUID := '6adc3d6a-a695-4b77-b34e-e53e588d1075';
  v_supplier_account_id UUID := 'dcf042ba-295d-48d7-9cd5-f7785c74a3bd';
  v_rec RECORD;
BEGIN
  -- Disable protection triggers
  ALTER TABLE public.journal_entry_lines DISABLE TRIGGER trg_protect_posted_journal_lines;

  FOR v_rec IN
    SELECT je.id as je_id, je.entry_number, i.invoice_number, i.subtotal, i.vat_amount, i.total
    FROM journal_entries je
    JOIN invoices i ON i.id = je.reference_id
    WHERE je.company_id = v_company_id
      AND je.reference_type = 'invoice_purchase'
      AND i.invoice_number IN (
        'PUR-1','PUR-2','PUR-3','PUR-4','PUR-5','PUR-6','PUR-7','PUR-8',
        'PUR-9','PUR-10','PUR-11','PUR-12','PUR-13','PUR-14','PUR-15','PUR-16',
        'PUR-17','PUR-18','PUR-19','PUR-20','PUR-21','PUR-22','PUR-23','PUR-24',
        'PUR-25','PUR-26','PUR-27','PUR-28','PUR-29','PUR-30','PUR-31','PUR-32'
      )
  LOOP
    -- Delete existing lines
    DELETE FROM public.journal_entry_lines WHERE journal_entry_id = v_rec.je_id;

    -- Insert new lines
    -- 1: Debit تكاليف تطوير = subtotal
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
    VALUES (v_rec.je_id, v_cost_account_id, v_rec.subtotal, 0,
            'تكاليف تطوير - ' || v_rec.invoice_number || ' - مؤسسة غصون التجارية');

    -- 2: Debit ضريبة مشتريات = vat_amount
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
    VALUES (v_rec.je_id, v_vat_account_id, v_rec.vat_amount, 0,
            'ضريبة مشتريات مستردة - ' || v_rec.invoice_number);

    -- 3: Credit ذمم دائنة = total
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
    VALUES (v_rec.je_id, v_supplier_account_id, 0, v_rec.total,
            'مؤسسة غصون التجارية - ' || v_rec.invoice_number);
  END LOOP;

  -- Re-enable triggers
  ALTER TABLE public.journal_entry_lines ENABLE TRIGGER trg_protect_posted_journal_lines;
END;
$$;
