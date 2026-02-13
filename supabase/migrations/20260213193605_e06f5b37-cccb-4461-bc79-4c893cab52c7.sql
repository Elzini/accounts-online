-- Fix payroll_records: remove permissive policies, keep admin-only secure ones
DROP POLICY IF EXISTS "Users can view payroll in their company" ON public.payroll_records;
DROP POLICY IF EXISTS "Users can insert payroll in their company" ON public.payroll_records;
DROP POLICY IF EXISTS "Users can update payroll in their company" ON public.payroll_records;
DROP POLICY IF EXISTS "Users can delete payroll in their company" ON public.payroll_records;
DROP POLICY IF EXISTS "strict_isolation" ON public.payroll_records;

-- Fix payroll_items: replace company-only policies with admin-restricted ones
DROP POLICY IF EXISTS "Users can view payroll items via payroll" ON public.payroll_items;
DROP POLICY IF EXISTS "Users can insert payroll items via payroll" ON public.payroll_items;
DROP POLICY IF EXISTS "Users can update payroll items via payroll" ON public.payroll_items;
DROP POLICY IF EXISTS "Users can delete payroll items via payroll" ON public.payroll_items;

CREATE POLICY "Admin can view payroll items"
ON public.payroll_items FOR SELECT
USING (
  payroll_id IN (
    SELECT id FROM payroll_records
    WHERE can_access_company_data(company_id) AND secure_has_permission('admin'::user_permission)
  )
);

CREATE POLICY "Admin can insert payroll items"
ON public.payroll_items FOR INSERT
WITH CHECK (
  payroll_id IN (
    SELECT id FROM payroll_records
    WHERE can_access_company_data(company_id) AND secure_has_permission('admin'::user_permission)
  )
);

CREATE POLICY "Admin can update payroll items"
ON public.payroll_items FOR UPDATE
USING (
  payroll_id IN (
    SELECT id FROM payroll_records
    WHERE can_access_company_data(company_id) AND secure_has_permission('admin'::user_permission)
  )
);

CREATE POLICY "Admin can delete payroll items"
ON public.payroll_items FOR DELETE
USING (
  payroll_id IN (
    SELECT id FROM payroll_records
    WHERE can_access_company_data(company_id) AND secure_has_permission('admin'::user_permission)
  )
);

-- Fix suppliers: remove permissive policies that bypass role checks
DROP POLICY IF EXISTS "Insert suppliers in company" ON public.suppliers;
DROP POLICY IF EXISTS "Update suppliers in company" ON public.suppliers;