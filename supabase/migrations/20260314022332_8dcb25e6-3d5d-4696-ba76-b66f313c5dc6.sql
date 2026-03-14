CREATE POLICY "strict_isolation" ON public.sms_provider_configs
  FOR ALL TO authenticated
  USING (strict_company_check(company_id::uuid))
  WITH CHECK (strict_company_check(company_id::uuid));