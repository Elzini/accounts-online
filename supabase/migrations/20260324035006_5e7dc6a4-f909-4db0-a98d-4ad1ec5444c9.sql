-- Temporarily disable protection trigger to delete Afaq payment entries
ALTER TABLE journal_entries DISABLE TRIGGER trg_protect_posted_journal_entries;

DELETE FROM journal_entry_lines 
WHERE journal_entry_id IN (
  SELECT id FROM journal_entries 
  WHERE company_id = 'be98c761-377f-41c0-ac43-27d2707295ca' 
  AND description LIKE 'سداد فاتورة شراء%'
);

DELETE FROM journal_entries 
WHERE company_id = 'be98c761-377f-41c0-ac43-27d2707295ca' 
AND description LIKE 'سداد فاتورة شراء%';

-- Re-enable the protection trigger
ALTER TABLE journal_entries ENABLE TRIGGER trg_protect_posted_journal_entries;