
-- Restrict api_keys table access to super_admin ONLY (not regular admins)
-- This protects API key hashes and previews from broader admin access

DROP POLICY IF EXISTS "Admin can view company API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admin can create company API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admin can update company API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admin can delete company API keys" ON public.api_keys;

-- Super admin only policies
CREATE POLICY "Super admin can view company API keys"
ON public.api_keys FOR SELECT
USING (auth.uid() IS NOT NULL AND strict_company_check(company_id) AND is_super_admin(auth.uid()));

CREATE POLICY "Super admin can create company API keys"
ON public.api_keys FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id) AND is_super_admin(auth.uid()));

CREATE POLICY "Super admin can update company API keys"
ON public.api_keys FOR UPDATE
USING (auth.uid() IS NOT NULL AND strict_company_check(company_id) AND is_super_admin(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id) AND is_super_admin(auth.uid()));

CREATE POLICY "Super admin can delete company API keys"
ON public.api_keys FOR DELETE
USING (auth.uid() IS NOT NULL AND strict_company_check(company_id) AND is_super_admin(auth.uid()));
