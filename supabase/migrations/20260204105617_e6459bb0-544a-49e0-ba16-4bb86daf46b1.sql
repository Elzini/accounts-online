-- Drop existing policies on cars table
DROP POLICY IF EXISTS "Users can view company cars" ON public.cars;
DROP POLICY IF EXISTS "Users can insert company cars" ON public.cars;
DROP POLICY IF EXISTS "Users can update company cars" ON public.cars;
DROP POLICY IF EXISTS "Users can delete company cars" ON public.cars;

-- Recreate with explicit authentication requirement
CREATE POLICY "Authenticated users can view company cars"
ON public.cars
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
);

CREATE POLICY "Authenticated users can insert company cars"
ON public.cars
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.has_permission('purchases') OR public.has_permission('admin') OR public.is_super_admin(auth.uid()))
);

CREATE POLICY "Authenticated users can update company cars"
ON public.cars
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.has_permission('purchases') OR public.has_permission('admin') OR public.is_super_admin(auth.uid()))
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
);

CREATE POLICY "Authenticated users can delete company cars"
ON public.cars
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.has_permission('admin') OR public.is_super_admin(auth.uid()))
);