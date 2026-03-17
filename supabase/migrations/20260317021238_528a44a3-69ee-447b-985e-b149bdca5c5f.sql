
DELETE FROM credit_debit_notes 
WHERE company_id = 'be98c761-377f-41c0-ac43-27d2707295ca' 
  AND note_type = 'debit'
  AND id IN (
    '4dff7be4-298c-4f33-be68-ae02f99769bd',
    '6a7c928f-fa8f-4f23-b790-510fc82338de',
    '1e816d93-637f-4676-93a4-5cbf9025144b'
  );
