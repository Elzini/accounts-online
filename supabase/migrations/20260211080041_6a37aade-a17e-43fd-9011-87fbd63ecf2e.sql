
-- Drop the safe view first (depends on the columns)
DROP VIEW IF EXISTS public.bank_accounts_safe;

-- Remove plaintext sensitive columns (no data exists)
ALTER TABLE public.bank_accounts DROP COLUMN IF EXISTS account_number;
ALTER TABLE public.bank_accounts DROP COLUMN IF EXISTS iban;

-- Recreate the safe view using encrypted columns (masked output)
CREATE VIEW public.bank_accounts_safe
WITH (security_invoker = on) AS
SELECT
  id,
  company_id,
  account_name,
  bank_name,
  CASE
    WHEN account_number_encrypted IS NOT NULL AND length(account_number_encrypted) > 4
    THEN '••••••' || right(account_number_encrypted, 4)
    ELSE account_number_encrypted
  END AS account_number_masked,
  CASE
    WHEN iban_encrypted IS NOT NULL AND length(iban_encrypted) > 6
    THEN left(iban_encrypted, 2) || '••••••••••••' || right(iban_encrypted, 4)
    ELSE iban_encrypted
  END AS iban_masked,
  CASE
    WHEN swift_code IS NOT NULL AND length(swift_code) > 4
    THEN left(swift_code, 2) || '••' || right(swift_code, 2)
    ELSE swift_code
  END AS swift_code_masked,
  account_category_id,
  opening_balance,
  current_balance,
  is_active,
  notes,
  created_at,
  updated_at
FROM bank_accounts;

-- Clean up duplicate/redundant RLS policies (keep only the strictest set)
DROP POLICY IF EXISTS "Company isolation select" ON public.bank_accounts;
DROP POLICY IF EXISTS "Company isolation insert" ON public.bank_accounts;
DROP POLICY IF EXISTS "Company isolation update" ON public.bank_accounts;
DROP POLICY IF EXISTS "Company isolation delete" ON public.bank_accounts;
DROP POLICY IF EXISTS "Manage bank_accounts in company" ON public.bank_accounts;
DROP POLICY IF EXISTS "View bank_accounts in company" ON public.bank_accounts;
DROP POLICY IF EXISTS "Insert bank accounts in company" ON public.bank_accounts;
DROP POLICY IF EXISTS "Authenticated admins can view company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Authenticated admins can insert company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Authenticated admins can update company bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Authenticated admins can delete company bank accounts" ON public.bank_accounts;
