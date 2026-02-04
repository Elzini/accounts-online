-- Drop all existing policies on bank_accounts
DROP POLICY IF EXISTS "Admins can view company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins can insert company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins can update company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins can delete company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can view company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can insert company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can update company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can delete company bank accounts" ON public.bank_accounts;

-- Recreate with explicit authentication requirement (admin only)
CREATE POLICY "Authenticated admins can view company bank accounts"
ON public.bank_accounts
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()))
);

CREATE POLICY "Authenticated admins can insert company bank accounts"
ON public.bank_accounts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()))
);

CREATE POLICY "Authenticated admins can update company bank accounts"
ON public.bank_accounts
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()))
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
);

CREATE POLICY "Authenticated admins can delete company bank accounts"
ON public.bank_accounts
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()))
);