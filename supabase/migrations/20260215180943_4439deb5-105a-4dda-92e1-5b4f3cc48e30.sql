
-- 1. Restrict employees table to HR/payroll/admin roles (not just any admin)
DROP POLICY IF EXISTS "Admin only - view employees" ON public.employees;
DROP POLICY IF EXISTS "Admin only - insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admin only - update employees" ON public.employees;
DROP POLICY IF EXISTS "Admin only - delete employees" ON public.employees;
DROP POLICY IF EXISTS "employees_strict_isolation" ON public.employees;

-- SELECT: only users with HR-related permissions
CREATE POLICY "hr_only_view_employees" ON public.employees
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      company_id = public.get_user_company_id(auth.uid())
      AND public.has_hr_access(company_id)
    )
  );

-- INSERT: HR roles only
CREATE POLICY "hr_only_insert_employees" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      company_id = public.get_user_company_id(auth.uid())
      AND public.has_hr_access(company_id)
    )
  );

-- UPDATE: HR roles only
CREATE POLICY "hr_only_update_employees" ON public.employees
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      company_id = public.get_user_company_id(auth.uid())
      AND public.has_hr_access(company_id)
    )
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      company_id = public.get_user_company_id(auth.uid())
      AND public.has_hr_access(company_id)
    )
  );

-- DELETE: admin only
CREATE POLICY "admin_only_delete_employees" ON public.employees
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      company_id = public.get_user_company_id(auth.uid())
      AND public.is_admin(auth.uid())
    )
  );

-- 2. Recreate employees_safe view with field-level masking
DROP VIEW IF EXISTS public.employees_safe;

CREATE VIEW public.employees_safe
WITH (security_invoker = on) AS
SELECT
  id, company_id, employee_number, name, job_title, hire_date, is_active,
  -- Salary fields: only visible to HR roles
  CASE WHEN public.has_hr_access(company_id) THEN base_salary ELSE NULL END AS base_salary,
  CASE WHEN public.has_hr_access(company_id) THEN housing_allowance ELSE NULL END AS housing_allowance,
  CASE WHEN public.has_hr_access(company_id) THEN transport_allowance ELSE NULL END AS transport_allowance,
  -- Phone: masked for non-HR
  CASE WHEN public.has_hr_access(company_id) THEN phone
    ELSE CASE WHEN phone IS NOT NULL THEN '••••' || RIGHT(phone, 4) ELSE NULL END
  END AS phone_masked,
  -- IBAN: masked for non-HR
  CASE WHEN public.has_hr_access(company_id) THEN iban
    ELSE CASE WHEN iban IS NOT NULL THEN '••••' || RIGHT(iban, 4) ELSE NULL END
  END AS iban_masked,
  -- ID number: masked for non-HR
  CASE WHEN public.has_hr_access(company_id) THEN id_number
    ELSE CASE WHEN id_number IS NOT NULL THEN '••••' || RIGHT(id_number, 4) ELSE NULL END
  END AS id_number_masked,
  NULL::text AS id_number_encrypted,
  NULL::text AS iban_encrypted,
  notes, created_at, updated_at
FROM public.employees;

GRANT SELECT ON public.employees_safe TO authenticated;
REVOKE SELECT ON public.employees_safe FROM anon;

-- 3. Audit function for sensitive employee data access
CREATE OR REPLACE FUNCTION public.get_employee_full_details(p_employee_id UUID)
RETURNS SETOF public.employees
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT e.company_id INTO v_company_id
  FROM employees e WHERE e.id = p_employee_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Employee not found';
  END IF;

  IF NOT (is_super_admin(v_user_id) OR (get_user_company_id(v_user_id) = v_company_id AND has_hr_access(v_company_id))) THEN
    RAISE EXCEPTION 'Access denied: HR permission required';
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, company_id, entity_type, entity_id, action, new_data)
  VALUES (
    v_user_id, v_company_id, 'employee', p_employee_id::text,
    'view_full_details',
    jsonb_build_object('accessed_at', now(), 'fields', ARRAY['phone', 'id_number', 'iban', 'base_salary'])
  );

  RETURN QUERY SELECT * FROM employees WHERE id = p_employee_id AND company_id = v_company_id;
END;
$$;
