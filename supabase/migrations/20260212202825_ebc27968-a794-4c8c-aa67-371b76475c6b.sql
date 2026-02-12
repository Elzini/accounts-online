
-- Drop existing permissive policies on api_keys
DROP POLICY IF EXISTS "Users can view their company API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create API keys for their company" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their company API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their company API keys" ON public.api_keys;

-- Create admin-only policies
CREATE POLICY "Admin can view company API keys"
ON public.api_keys FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND strict_company_check(company_id)
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);

CREATE POLICY "Admin can create company API keys"
ON public.api_keys FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND strict_company_check(company_id)
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);

CREATE POLICY "Admin can update company API keys"
ON public.api_keys FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND strict_company_check(company_id)
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND strict_company_check(company_id)
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);

CREATE POLICY "Admin can delete company API keys"
ON public.api_keys FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND strict_company_check(company_id)
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);
