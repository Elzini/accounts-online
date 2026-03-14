
-- Remove the ALL policy that overrides the SELECT denial
DROP POLICY IF EXISTS "strict_isolation" ON public.financing_companies;

-- Re-add strict_isolation for INSERT/UPDATE/DELETE only (not SELECT)
CREATE POLICY "strict_isolation_insert" ON public.financing_companies
  FOR INSERT TO authenticated
  WITH CHECK (strict_company_check(company_id));

CREATE POLICY "strict_isolation_update" ON public.financing_companies
  FOR UPDATE TO authenticated
  USING (strict_company_check(company_id))
  WITH CHECK (strict_company_check(company_id));

CREATE POLICY "strict_isolation_delete" ON public.financing_companies
  FOR DELETE TO authenticated
  USING (strict_company_check(company_id));
