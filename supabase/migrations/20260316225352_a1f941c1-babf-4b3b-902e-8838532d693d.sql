
UPDATE invoices 
SET 
  project_id = 'e518d009-1535-4b6e-bc07-18eaab9c6b02',
  payment_account_id = '41729f4d-95a1-44ef-acfe-6baa044b1b4f',
  payment_status = 'paid',
  amount_paid = total
WHERE company_id = 'be98c761-377f-41c0-ac43-27d2707295ca' 
  AND invoice_type = 'purchase';
