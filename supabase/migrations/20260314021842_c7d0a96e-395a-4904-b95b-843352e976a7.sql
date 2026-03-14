DROP POLICY IF EXISTS "otp_select" ON public.critical_operation_otps;

CREATE POLICY "otp_select" ON public.critical_operation_otps
  FOR SELECT TO authenticated
  USING (
    requested_by = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.permission = 'admin'
      )
      AND strict_company_check(company_id)
    )
  );