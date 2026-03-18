
-- Fix broken RLS policies on zatca_config table
-- Replace profiles.id with profiles.user_id and restrict to admin-only

DROP POLICY IF EXISTS "zatca_config_select" ON public.zatca_config;
DROP POLICY IF EXISTS "zatca_config_insert" ON public.zatca_config;
DROP POLICY IF EXISTS "zatca_config_update" ON public.zatca_config;

-- SELECT: admin-only with correct user_id reference
CREATE POLICY "zatca_config_select" ON public.zatca_config
  FOR SELECT TO authenticated
  USING (
    strict_company_check(company_id)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.permission IN ('admin', 'super_admin')
    )
  );

-- INSERT: admin-only with correct user_id reference
CREATE POLICY "zatca_config_insert" ON public.zatca_config
  FOR INSERT TO authenticated
  WITH CHECK (
    strict_company_check(company_id)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.permission IN ('admin', 'super_admin')
    )
  );

-- UPDATE: admin-only with correct user_id reference
CREATE POLICY "zatca_config_update" ON public.zatca_config
  FOR UPDATE TO authenticated
  USING (
    strict_company_check(company_id)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.permission IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    strict_company_check(company_id)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.permission IN ('admin', 'super_admin')
    )
  );
