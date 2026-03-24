-- Fix app_settings: restrict NULL company_id rows to super_admin only
-- The strict_isolation_authenticated policy grants any authenticated user
-- SELECT on rows where company_id IS NULL (system-wide settings)

DROP POLICY IF EXISTS "strict_isolation_authenticated" ON public.app_settings;

-- Replace with a policy that only allows company-scoped access for regular users
-- and system-wide (NULL company_id) access for super_admins only
CREATE POLICY "strict_isolation_authenticated" ON public.app_settings
FOR ALL TO authenticated
USING (
  (company_id IS NOT NULL AND strict_company_check(company_id))
  OR
  (company_id IS NULL AND is_super_admin(auth.uid()))
)
WITH CHECK (
  (company_id IS NOT NULL AND strict_company_check(company_id))
  OR
  (company_id IS NULL AND is_super_admin(auth.uid()))
);