-- Insert journal entry lines for 262 sales invoices
-- The trigger validate_journal_entry_balance will auto-update totals

DO $$
DECLARE
  rec RECORD;
  v_je_id uuid;
BEGIN
  FOR rec IN 
    SELECT je.id as je_id, je.description, i.subtotal, i.vat_amount, i.total
    FROM journal_entries je
    JOIN invoices i ON i.id = je.reference_id::uuid
    WHERE je.company_id = '3b6672f6-8639-4bab-ae4a-7a359528e03b' 
      AND je.reference_type = 'sale'
      AND NOT EXISTS (SELECT 1 FROM journal_entry_lines jel WHERE jel.journal_entry_id = je.id)
  LOOP
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit) VALUES
      (rec.je_id, 'c2a426ca-2a8d-40ef-8914-d2b8953278e2', rec.description, rec.total, 0),
      (rec.je_id, '091f773d-784a-4371-8d16-88b6657e4749', rec.description, 0, rec.subtotal),
      (rec.je_id, '927b5050-6b98-46a6-902b-20b0c36148c7', rec.description, 0, rec.vat_amount);
  END LOOP;
END $$;