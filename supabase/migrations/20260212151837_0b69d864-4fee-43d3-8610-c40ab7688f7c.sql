
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can manage integrations" ON public.integration_configs;

-- Admin SELECT
CREATE POLICY "Admins can view company integrations"
ON public.integration_configs
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Admin INSERT
CREATE POLICY "Admins can create company integrations"
ON public.integration_configs
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Admin UPDATE
CREATE POLICY "Admins can update company integrations"
ON public.integration_configs
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Admin DELETE
CREATE POLICY "Admins can delete company integrations"
ON public.integration_configs
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);
