
-- 1. Create audit log function for bank account access tracking
CREATE OR REPLACE FUNCTION public.log_bank_account_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    company_id,
    entity_type,
    entity_id,
    action,
    new_data,
    ip_address
  ) VALUES (
    auth.uid(),
    NEW.company_id,
    'bank_account',
    NEW.id::text,
    'view_sensitive',
    jsonb_build_object('accessed_fields', ARRAY['iban_encrypted', 'account_number_encrypted']),
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  RETURN NEW;
END;
$$;

-- 2. Restrict direct bank_accounts table: only super_admin can see encrypted fields
-- Regular admins must use the safe view
DROP POLICY IF EXISTS "View bank_accounts in company" ON public.bank_accounts;
DROP POLICY IF EXISTS "Manage bank_accounts in company" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_strict_isolation" ON public.bank_accounts;
DROP POLICY IF EXISTS "Company isolation select" ON public.bank_accounts;
DROP POLICY IF EXISTS "Insert bank accounts in company" ON public.bank_accounts;

-- Super admin: full access
CREATE POLICY "super_admin_bank_accounts" ON public.bank_accounts
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Admin: SELECT only non-encrypted fields through safe view (security_invoker enforces this)
-- For direct table: admin can INSERT/UPDATE/DELETE but SELECT is restricted
CREATE POLICY "admin_bank_accounts_select" ON public.bank_accounts
  FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "admin_bank_accounts_insert" ON public.bank_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "admin_bank_accounts_update" ON public.bank_accounts
  FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin(auth.uid())
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "admin_bank_accounts_delete" ON public.bank_accounts
  FOR DELETE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin(auth.uid())
  );

-- 3. Recreate safe view: hide encrypted fields entirely, show only masked versions
DROP VIEW IF EXISTS public.bank_accounts_safe;

CREATE VIEW public.bank_accounts_safe
WITH (security_invoker = on)
AS
SELECT
  id,
  company_id,
  account_name,
  bank_name,
  CASE
    WHEN account_number_encrypted IS NOT NULL AND length(account_number_encrypted) > 4
    THEN '••••' || right(account_number_encrypted, 4)
    ELSE NULL
  END AS account_number_masked,
  CASE
    WHEN iban_encrypted IS NOT NULL AND length(iban_encrypted) > 6
    THEN 'SA••••••••••••' || right(iban_encrypted, 4)
    ELSE NULL
  END AS iban_masked,
  NULL::text AS swift_code_masked,
  account_category_id,
  opening_balance,
  current_balance,
  is_active,
  notes,
  created_at,
  updated_at
FROM bank_accounts;

GRANT SELECT ON public.bank_accounts_safe TO authenticated;
REVOKE SELECT ON public.bank_accounts_safe FROM anon;

-- 4. Create a secure function for full bank account details (audit-logged)
CREATE OR REPLACE FUNCTION public.get_bank_account_full_details(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_name TEXT,
  bank_name TEXT,
  account_number_encrypted TEXT,
  iban_encrypted TEXT,
  swift_code TEXT,
  current_balance NUMERIC,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Verify caller is admin of the account's company
  SELECT ba.company_id INTO v_company_id
  FROM bank_accounts ba
  WHERE ba.id = p_account_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Bank account not found';
  END IF;

  IF NOT (is_super_admin(v_user_id) OR (get_user_company_id(v_user_id) = v_company_id AND is_admin(v_user_id))) THEN
    RAISE EXCEPTION 'Access denied: admin permission required';
  END IF;

  -- Log the access
  INSERT INTO audit_logs (user_id, company_id, entity_type, entity_id, action, new_data)
  VALUES (
    v_user_id,
    v_company_id,
    'bank_account',
    p_account_id::text,
    'view_full_details',
    jsonb_build_object('accessed_at', now(), 'fields', ARRAY['iban_encrypted', 'account_number_encrypted', 'swift_code'])
  );

  RETURN QUERY
  SELECT ba.id, ba.account_name, ba.bank_name, 
         ba.account_number_encrypted, ba.iban_encrypted, ba.swift_code,
         ba.current_balance, ba.is_active
  FROM bank_accounts ba
  WHERE ba.id = p_account_id AND ba.company_id = v_company_id;
END;
$$;
