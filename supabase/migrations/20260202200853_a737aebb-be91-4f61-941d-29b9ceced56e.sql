-- Create bank_accounts_safe view with masked sensitive fields
-- Uses security_invoker to inherit RLS from base table
CREATE OR REPLACE VIEW public.bank_accounts_safe
WITH (security_invoker=on)
AS
SELECT
  id,
  company_id,
  account_name,
  bank_name,
  -- Mask account number: show only last 4 digits
  CASE 
    WHEN account_number IS NOT NULL AND LENGTH(account_number) > 4 
    THEN '••••••' || RIGHT(account_number, 4)
    ELSE account_number
  END AS account_number_masked,
  -- Mask IBAN: show country code + last 4 digits
  CASE 
    WHEN iban IS NOT NULL AND LENGTH(iban) > 6 
    THEN LEFT(iban, 2) || '••••••••••••' || RIGHT(iban, 4)
    ELSE iban
  END AS iban_masked,
  -- SWIFT code is less sensitive (public routing info), but mask middle
  CASE 
    WHEN swift_code IS NOT NULL AND LENGTH(swift_code) > 4 
    THEN LEFT(swift_code, 2) || '••' || RIGHT(swift_code, 2)
    ELSE swift_code
  END AS swift_code_masked,
  account_category_id,
  opening_balance,
  current_balance,
  is_active,
  notes,
  created_at,
  updated_at
FROM public.bank_accounts;

-- Grant access to authenticated users (RLS will filter)
GRANT SELECT ON public.bank_accounts_safe TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.bank_accounts_safe IS 'Safe view for bank accounts with masked sensitive fields (account numbers, IBAN). Use this for general read operations. Full access to base table requires admin permission.';