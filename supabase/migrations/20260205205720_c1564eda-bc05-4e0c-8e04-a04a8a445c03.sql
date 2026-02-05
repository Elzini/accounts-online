-- Remove any policies that might allow public/anon access
DROP POLICY IF EXISTS "Insert fiscal years in company" ON public.fiscal_years;
DROP POLICY IF EXISTS "View fiscal years in company" ON public.fiscal_years;
DROP POLICY IF EXISTS "Manage fiscal years - admins only" ON public.fiscal_years;

-- Recreate the admin policy with authenticated role only
CREATE POLICY "Manage fiscal years - admins only"
ON public.fiscal_years
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid()) OR 
  ((company_id = get_user_company_id(auth.uid())) AND is_admin(auth.uid()))
)
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  ((company_id = get_user_company_id(auth.uid())) AND is_admin(auth.uid()))
);

-- Create insert policy for authenticated admins only
CREATE POLICY "Insert fiscal years - admins only"
ON public.fiscal_years
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  ((company_id = get_user_company_id(auth.uid())) AND is_admin(auth.uid()))
);