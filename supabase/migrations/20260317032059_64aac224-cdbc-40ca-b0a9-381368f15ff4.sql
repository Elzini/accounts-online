
ALTER TABLE journal_entries DISABLE TRIGGER trg_protect_posted_journal_entries;

DELETE FROM journal_entry_lines 
WHERE journal_entry_id IN (
  SELECT id FROM journal_entries 
  WHERE reference_type IN ('invoice_purchase', 'invoice_sale')
  AND reference_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (reference_id) id 
    FROM journal_entries 
    WHERE reference_type IN ('invoice_purchase', 'invoice_sale')
    AND reference_id IS NOT NULL
    ORDER BY reference_id, created_at DESC
  )
);

DELETE FROM journal_entries 
WHERE reference_type IN ('invoice_purchase', 'invoice_sale')
AND reference_id IS NOT NULL
AND id NOT IN (
  SELECT DISTINCT ON (reference_id) id 
  FROM journal_entries 
  WHERE reference_type IN ('invoice_purchase', 'invoice_sale')
  AND reference_id IS NOT NULL
  ORDER BY reference_id, created_at DESC
);

ALTER TABLE journal_entries ENABLE TRIGGER trg_protect_posted_journal_entries;
