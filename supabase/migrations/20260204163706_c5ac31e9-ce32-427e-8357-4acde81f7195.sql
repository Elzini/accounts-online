-- First, ensure RLS is enabled on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on employees table to start fresh
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Admins can view employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;

-- Create helper function to check if user has admin role for a company (if not exists)
CREATE OR REPLACE FUNCTION public.has_company_admin_role(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.permission IN ('admin', 'super_admin')
      AND (p.company_id = _company_id OR ur.permission = 'super_admin')
  )
$$;

-- Create strict RLS policies for employees table - ADMIN ONLY access
-- SELECT: Only admin/super_admin can view employee sensitive data
CREATE POLICY "Only admins can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  public.has_company_admin_role(auth.uid(), company_id)
);

-- INSERT: Only admin/super_admin can add employees
CREATE POLICY "Only admins can insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_company_admin_role(auth.uid(), company_id)
);

-- UPDATE: Only admin/super_admin can update employees
CREATE POLICY "Only admins can update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  public.has_company_admin_role(auth.uid(), company_id)
)
WITH CHECK (
  public.has_company_admin_role(auth.uid(), company_id)
);

-- DELETE: Only admin/super_admin can delete employees
CREATE POLICY "Only admins can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (
  public.has_company_admin_role(auth.uid(), company_id)
);

-- Add comment explaining the security model
COMMENT ON TABLE public.employees IS 'Contains sensitive employee PII (salary, phone, ID, IBAN). Access restricted to admin/super_admin users only via RLS. Non-admin users should use employees_safe view for masked data.';