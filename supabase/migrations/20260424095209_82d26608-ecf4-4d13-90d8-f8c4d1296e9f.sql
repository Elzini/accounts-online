-- Move misplaced VAT numbers from id_number → registration_number
-- Only when id_number looks like a Saudi VAT (15 digits starting with 3) AND registration_number is empty.
UPDATE public.suppliers
   SET registration_number = id_number,
       id_number = NULL
 WHERE id_number ~ '^3[0-9]{14}$'
   AND (registration_number IS NULL OR registration_number = '');