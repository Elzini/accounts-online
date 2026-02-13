
-- Drop existing view first then recreate
DROP VIEW IF EXISTS public.employees_safe;

CREATE VIEW public.employees_safe
WITH (security_invoker = on) AS
SELECT
  id, company_id, employee_number, name, job_title, hire_date,
  is_active, base_salary, housing_allowance, transport_allowance,
  notes, created_at, updated_at,
  CASE WHEN phone IS NOT NULL THEN '****' || right(phone, 4) ELSE NULL END AS phone_masked,
  CASE WHEN iban IS NOT NULL THEN '****' || right(iban, 4) ELSE NULL END AS iban_masked,
  NULL::text AS id_number_encrypted,
  NULL::text AS iban_encrypted
FROM public.employees;
