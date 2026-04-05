
CREATE OR REPLACE FUNCTION public.force_delete_invoice(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id uuid;
BEGIN
  -- Remove journal_entry_id reference from invoice
  UPDATE invoices SET journal_entry_id = NULL WHERE id = p_invoice_id;

  -- Find and delete linked journal entries
  FOR v_entry_id IN
    SELECT id FROM journal_entries WHERE reference_id = p_invoice_id
  LOOP
    -- Delete journal entry lines
    DELETE FROM journal_entry_lines WHERE journal_entry_id = v_entry_id;
    -- Unpost and delete journal entry
    UPDATE journal_entries SET is_posted = false WHERE id = v_entry_id;
    DELETE FROM journal_entries WHERE id = v_entry_id;
  END LOOP;

  -- Delete invoice items (disable trigger temporarily)
  ALTER TABLE invoice_items DISABLE TRIGGER trg_protect_approved_invoice_items;
  DELETE FROM invoice_items WHERE invoice_id = p_invoice_id;
  ALTER TABLE invoice_items ENABLE TRIGGER trg_protect_approved_invoice_items;

  -- Delete invoice (disable trigger temporarily)
  ALTER TABLE invoices DISABLE TRIGGER trg_protect_approved_invoices;
  DELETE FROM invoices WHERE id = p_invoice_id;
  ALTER TABLE invoices ENABLE TRIGGER trg_protect_approved_invoices;
END;
$$;
