
-- Recreate bank_accounts_safe view with security_invoker=on to inherit RLS from base table
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

-- Grant access to authenticated users (RLS on base table will enforce actual access control)
GRANT SELECT ON public.bank_accounts_safe TO authenticated;
REVOKE SELECT ON public.bank_accounts_safe FROM anon;
