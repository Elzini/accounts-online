
-- Change has_hr_access from SECURITY DEFINER to SECURITY INVOKER
-- so the hr_employees_safe view respects RLS on the underlying hr_employees table
CREATE OR REPLACE FUNCTION public.has_hr_access(check_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
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
