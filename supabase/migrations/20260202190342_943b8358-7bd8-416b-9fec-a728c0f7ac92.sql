-- Remove all existing overly permissive policies on employees table
DROP POLICY IF EXISTS "Company isolation delete" ON public.employees;
DROP POLICY IF EXISTS "Company isolation insert" ON public.employees;
DROP POLICY IF EXISTS "Company isolation select" ON public.employees;
DROP POLICY IF EXISTS "Company isolation update" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
DROP POLICY IF EXISTS "employees_strict_isolation" ON public.employees;
DROP POLICY IF EXISTS "Employees secure delete" ON public.employees;
DROP POLICY IF EXISTS "Employees secure insert" ON public.employees;
DROP POLICY IF EXISTS "Employees secure select" ON public.employees;
DROP POLICY IF EXISTS "Employees secure update" ON public.employees;

-- Create strict admin-only policies for employee data
-- Only admins can view employee data (contains sensitive PII, salary, IBAN)
CREATE POLICY "Admin only - view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Only admins can create employees
CREATE POLICY "Admin only - insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Only admins can update employees
CREATE POLICY "Admin only - update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Only admins can delete employees
CREATE POLICY "Admin only - delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);