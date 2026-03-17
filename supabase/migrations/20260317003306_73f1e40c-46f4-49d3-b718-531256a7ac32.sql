
-- Re-sequence purchase invoices: fill gap from deleted PUR-7
WITH numbered AS (
  SELECT id, invoice_number,
         'PUR-' || ROW_NUMBER() OVER (ORDER BY created_at ASC) AS new_number
  FROM invoices
  WHERE company_id = 'be98c761-377f-41c0-ac43-27d2707295ca'
    AND invoice_type = 'purchase'
)
UPDATE invoices
SET invoice_number = numbered.new_number
FROM numbered
WHERE invoices.id = numbered.id
  AND invoices.invoice_number != numbered.new_number
