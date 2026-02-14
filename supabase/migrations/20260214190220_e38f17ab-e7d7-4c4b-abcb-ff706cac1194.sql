
-- Step 1: Create HR access check function
CREATE OR REPLACE FUNCTION public.has_hr_access(check_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND p.company_id = check_company_id
      AND ur.permission IN ('admin', 'employees', 'payroll')
  );
$$;

-- Step 2: Drop existing permissive hr_employees policies
DROP POLICY IF EXISTS "hr_employees_select" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_insert" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_update" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_delete" ON public.hr_employees;

-- Step 3: Create strict HR-role-based policies
CREATE POLICY "hr_employees_select_strict"
ON public.hr_employees FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_hr_access(company_id)
);

CREATE POLICY "hr_employees_insert_strict"
ON public.hr_employees FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND has_hr_access(company_id)
);

CREATE POLICY "hr_employees_update_strict"
ON public.hr_employees FOR UPDATE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_hr_access(company_id)
);

CREATE POLICY "hr_employees_delete_strict"
ON public.hr_employees FOR DELETE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Step 4: Create safe view masking sensitive financial/PII data
CREATE OR REPLACE VIEW public.hr_employees_safe AS
SELECT
  id, company_id, employee_number, full_name, full_name_en,
  job_title, department, is_active, hire_date, contract_type,
  CASE WHEN public.has_hr_access(company_id) THEN base_salary ELSE NULL END AS base_salary,
  CASE WHEN public.has_hr_access(company_id) THEN housing_allowance ELSE NULL END AS housing_allowance,
  CASE WHEN public.has_hr_access(company_id) THEN transport_allowance ELSE NULL END AS transport_allowance,
  CASE WHEN public.has_hr_access(company_id) THEN other_allowances ELSE NULL END AS other_allowances,
  CASE WHEN public.has_hr_access(company_id) THEN phone ELSE 
    CASE WHEN phone IS NOT NULL THEN '****' || RIGHT(phone, 4) ELSE NULL END
  END AS phone,
  CASE WHEN public.has_hr_access(company_id) THEN national_id ELSE
    CASE WHEN national_id IS NOT NULL THEN '****' || RIGHT(national_id, 4) ELSE NULL END
  END AS national_id,
  CASE WHEN public.has_hr_access(company_id) THEN email ELSE NULL END AS email,
  CASE WHEN public.has_hr_access(company_id) THEN bank_name ELSE NULL END AS bank_name,
  CASE WHEN public.has_hr_access(company_id) THEN iban ELSE
    CASE WHEN iban IS NOT NULL THEN '****' || RIGHT(iban, 4) ELSE NULL END
  END AS iban,
  notes, created_at, updated_at
FROM public.hr_employees;
