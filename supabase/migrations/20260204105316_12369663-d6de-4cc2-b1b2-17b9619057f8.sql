-- Drop existing policies on customers table
DROP POLICY IF EXISTS "Users can view company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete company customers" ON public.customers;

-- Recreate policies with explicit authentication requirement
CREATE POLICY "Authenticated users can view company customers"
ON public.customers
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.has_permission('sales') OR public.has_permission('admin') OR public.is_super_admin(auth.uid()))
);

CREATE POLICY "Authenticated users can insert company customers"
ON public.customers
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.has_permission('sales') OR public.has_permission('admin') OR public.is_super_admin(auth.uid()))
);

CREATE POLICY "Authenticated users can update company customers"
ON public.customers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.has_permission('sales') OR public.has_permission('admin') OR public.is_super_admin(auth.uid()))
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
);

CREATE POLICY "Authenticated users can delete company customers"
ON public.customers
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.has_permission('admin') OR public.is_super_admin(auth.uid()))
);