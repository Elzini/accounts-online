
-- Restrict encryption_key_registry to admin/super_admin only

DROP POLICY IF EXISTS "Company members can view encryption keys" ON encryption_key_registry;
DROP POLICY IF EXISTS "Company members can manage encryption keys" ON encryption_key_registry;

CREATE POLICY "Admins can view encryption keys" ON encryption_key_registry
FOR SELECT TO authenticated
USING (
  public.strict_company_check(company_id)
  AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.permission IN ('admin', 'super_admin'))
  )
);

CREATE POLICY "Admins can insert encryption keys" ON encryption_key_registry
FOR INSERT TO authenticated
WITH CHECK (
  public.strict_company_check(company_id)
  AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.permission IN ('admin', 'super_admin'))
  )
);
