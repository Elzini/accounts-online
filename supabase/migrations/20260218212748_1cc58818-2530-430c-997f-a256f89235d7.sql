
-- Step 1: Drop old FK first
ALTER TABLE payroll_items DROP CONSTRAINT IF EXISTS payroll_items_employee_id_fkey;

-- Step 2: Update payroll_items employee_id to hr_employees ids  
UPDATE payroll_items pi
SET employee_id = hr.id
FROM employees e, hr_employees hr
WHERE pi.employee_id = e.id
AND TRIM(e.name) = TRIM(hr.full_name);

-- Step 3: Add new FK to hr_employees
ALTER TABLE payroll_items ADD CONSTRAINT payroll_items_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE;

-- Step 4: Drop and recreate employees_safe view to use hr_employees
DROP VIEW IF EXISTS public.employees_safe;

CREATE VIEW public.employees_safe
WITH (security_invoker=on) AS
SELECT 
  id,
  company_id,
  employee_number::integer AS employee_number,
  full_name AS name,
  job_title,
  hire_date,
  is_active,
  CASE WHEN has_hr_access(company_id) THEN base_salary ELSE NULL::numeric END AS base_salary,
  CASE WHEN has_hr_access(company_id) THEN housing_allowance ELSE NULL::numeric END AS housing_allowance,
  CASE WHEN has_hr_access(company_id) THEN transport_allowance ELSE NULL::numeric END AS transport_allowance,
  CASE WHEN has_hr_access(company_id) THEN phone
    ELSE CASE WHEN phone IS NOT NULL THEN '••••' || RIGHT(phone, 4) ELSE NULL::text END
  END AS phone_masked,
  CASE WHEN has_hr_access(company_id) THEN iban
    ELSE CASE WHEN iban IS NOT NULL THEN '••••' || RIGHT(iban, 4) ELSE NULL::text END
  END AS iban_masked,
  CASE WHEN has_hr_access(company_id) THEN national_id
    ELSE CASE WHEN national_id IS NOT NULL THEN '••••' || RIGHT(national_id, 4) ELSE NULL::text END
  END AS id_number_masked,
  NULL::text AS id_number_encrypted,
  NULL::text AS iban_encrypted,
  notes,
  created_at,
  updated_at
FROM hr_employees;
