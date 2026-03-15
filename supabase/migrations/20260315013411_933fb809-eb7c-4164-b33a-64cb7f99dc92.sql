
-- Fix sensitive_operations_log: drop old policy and recreate with company_id restriction
DROP POLICY IF EXISTS "sensitive_ops_all" ON sensitive_operations_log;
CREATE POLICY "sensitive_ops_all" ON sensitive_operations_log
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    public.has_permission(auth.uid(), 'admin')
    AND company_id = public.get_user_company_id(auth.uid())
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'admin')
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- Fix data_integrity_checks: drop old policy and recreate with company_id restriction
DROP POLICY IF EXISTS "integrity_all" ON data_integrity_checks;
CREATE POLICY "integrity_all" ON data_integrity_checks
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    public.has_permission(auth.uid(), 'admin')
    AND company_id = public.get_user_company_id(auth.uid())
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'admin')
    AND company_id = public.get_user_company_id(auth.uid())
  );
