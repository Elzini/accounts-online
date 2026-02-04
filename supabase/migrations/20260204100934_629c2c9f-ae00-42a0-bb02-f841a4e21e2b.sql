-- Recreate the policies with correct function signatures
-- Drop any policies that may have been created
DROP POLICY IF EXISTS "Admins can view full supplier data" ON public.suppliers;
DROP POLICY IF EXISTS "Purchase users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Purchase users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Purchase users can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Super admins full supplier access" ON public.suppliers;
DROP POLICY IF EXISTS "Purchase users can view suppliers via safe view" ON public.suppliers;

-- Admins get full access to base table (including unmasked phone/registration)
CREATE POLICY "Admins can view full supplier data"
ON public.suppliers
FOR SELECT
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

-- Purchase users can still INSERT/UPDATE/DELETE
CREATE POLICY "Purchase users can insert suppliers"
ON public.suppliers
FOR INSERT
WITH CHECK (
  public.strict_company_check(company_id)
  AND public.rbac_check('purchases')
);

CREATE POLICY "Purchase users can update suppliers"
ON public.suppliers
FOR UPDATE
USING (
  public.strict_company_check(company_id)
  AND public.rbac_check('purchases')
)
WITH CHECK (
  public.strict_company_check(company_id)
  AND public.rbac_check('purchases')
);

CREATE POLICY "Purchase users can delete suppliers"
ON public.suppliers
FOR DELETE
USING (
  public.strict_company_check(company_id)
  AND public.rbac_check('purchases')
);

-- Super admins full access
CREATE POLICY "Super admins full supplier access"
ON public.suppliers
FOR ALL
USING (public.rbac_check('super_admin'));

-- Add SELECT policy for view access (needed for security_invoker view)
-- Purchase users can view but with masked data via the safe view
CREATE POLICY "Purchase users can view suppliers via safe view"
ON public.suppliers
FOR SELECT
USING (
  public.strict_company_check(company_id)
  AND public.rbac_check('purchases')
);

-- Add comment documenting the security architecture
COMMENT ON VIEW public.suppliers_safe IS 'Safe view for suppliers table - masks phone and registration_number. Use this view for general read operations. Only admins can access full data from base table.';