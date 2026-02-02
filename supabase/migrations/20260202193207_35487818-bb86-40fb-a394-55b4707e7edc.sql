-- Create a safe view for employees that masks sensitive data
-- The base table remains accessible only via specific use cases

CREATE OR REPLACE VIEW public.employees_safe
WITH (security_invoker=on) AS
SELECT 
  id,
  company_id,
  employee_number,
  name,
  job_title,
  base_salary,
  housing_allowance,
  transport_allowance,
  phone,
  -- Mask ID number: show only last 4 digits
  CASE 
    WHEN id_number IS NOT NULL AND length(id_number) > 4 
    THEN '••••••' || RIGHT(id_number, 4)
    ELSE NULL
  END as id_number_masked,
  bank_name,
  -- Mask IBAN: show only last 4 characters
  CASE 
    WHEN iban IS NOT NULL AND length(iban) > 4 
    THEN 'SA••••••••••••••••••' || RIGHT(iban, 4)
    ELSE NULL
  END as iban_masked,
  hire_date,
  is_active,
  notes,
  created_at,
  updated_at
FROM public.employees;

-- Grant access to the view
GRANT SELECT ON public.employees_safe TO authenticated;

-- Add comment explaining usage
COMMENT ON VIEW public.employees_safe IS 'Safe view for employees with masked sensitive data (ID number, IBAN). Use this view for general queries. Only use the base table when decrypted values are explicitly needed for payroll processing.';