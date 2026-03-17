
-- The ALL policy was already dropped and SELECT policy already exists. Just add the write policies.

DROP POLICY IF EXISTS "Admins can insert rate limits" ON rate_limit_config;
DROP POLICY IF EXISTS "Admins can update rate limits" ON rate_limit_config;
DROP POLICY IF EXISTS "Admins can delete rate limits" ON rate_limit_config;

CREATE POLICY "Admins can insert rate limits" ON rate_limit_config
FOR INSERT TO authenticated
WITH CHECK (
  public.strict_company_check(company_id)
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.permission IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can update rate limits" ON rate_limit_config
FOR UPDATE TO authenticated
USING (
  public.strict_company_check(company_id)
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.permission IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can delete rate limits" ON rate_limit_config
FOR DELETE TO authenticated
USING (
  public.strict_company_check(company_id)
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.permission IN ('admin', 'super_admin'))
);
