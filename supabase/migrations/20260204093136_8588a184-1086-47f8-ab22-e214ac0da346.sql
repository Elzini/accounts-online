-- Drop existing policies on bank_accounts
DROP POLICY IF EXISTS "Users can view bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can insert bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can update bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can delete bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Company users can view bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Company admins can manage bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "view_bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "insert_bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "update_bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "delete_bank_accounts" ON public.bank_accounts;

-- Create admin-only policies for bank_accounts
CREATE POLICY "Admins can view company bank accounts"
ON public.bank_accounts
FOR SELECT
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can insert company bank accounts"
ON public.bank_accounts
FOR INSERT
WITH CHECK (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update company bank accounts"
ON public.bank_accounts
FOR UPDATE
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete company bank accounts"
ON public.bank_accounts
FOR DELETE
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

-- Also restrict bank_accounts_safe view access to admins only
DROP POLICY IF EXISTS "Users can view safe bank accounts" ON public.bank_accounts;

-- Update related tables to admin-only access
-- Bank statements
DROP POLICY IF EXISTS "Users can view bank statements" ON public.bank_statements;
DROP POLICY IF EXISTS "Users can insert bank statements" ON public.bank_statements;
DROP POLICY IF EXISTS "Users can update bank statements" ON public.bank_statements;
DROP POLICY IF EXISTS "Users can delete bank statements" ON public.bank_statements;

CREATE POLICY "Admins can view company bank statements"
ON public.bank_statements
FOR SELECT
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can insert company bank statements"
ON public.bank_statements
FOR INSERT
WITH CHECK (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update company bank statements"
ON public.bank_statements
FOR UPDATE
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete company bank statements"
ON public.bank_statements
FOR DELETE
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

-- Bank transactions (via statement's bank_account)
DROP POLICY IF EXISTS "Users can view bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can insert bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can update bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can delete bank transactions" ON public.bank_transactions;

CREATE POLICY "Admins can view bank transactions"
ON public.bank_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba
    WHERE ba.id = bank_account_id
    AND public.strict_company_check(ba.company_id)
    AND public.is_admin(auth.uid())
  )
);

CREATE POLICY "Admins can insert bank transactions"
ON public.bank_transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba
    WHERE ba.id = bank_account_id
    AND public.strict_company_check(ba.company_id)
    AND public.is_admin(auth.uid())
  )
);

CREATE POLICY "Admins can update bank transactions"
ON public.bank_transactions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba
    WHERE ba.id = bank_account_id
    AND public.strict_company_check(ba.company_id)
    AND public.is_admin(auth.uid())
  )
);

CREATE POLICY "Admins can delete bank transactions"
ON public.bank_transactions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba
    WHERE ba.id = bank_account_id
    AND public.strict_company_check(ba.company_id)
    AND public.is_admin(auth.uid())
  )
);

-- Bank reconciliations
DROP POLICY IF EXISTS "Users can view bank reconciliations" ON public.bank_reconciliations;
DROP POLICY IF EXISTS "Users can insert bank reconciliations" ON public.bank_reconciliations;
DROP POLICY IF EXISTS "Users can update bank reconciliations" ON public.bank_reconciliations;
DROP POLICY IF EXISTS "Users can delete bank reconciliations" ON public.bank_reconciliations;

CREATE POLICY "Admins can view company bank reconciliations"
ON public.bank_reconciliations
FOR SELECT
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can insert company bank reconciliations"
ON public.bank_reconciliations
FOR INSERT
WITH CHECK (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update company bank reconciliations"
ON public.bank_reconciliations
FOR UPDATE
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete company bank reconciliations"
ON public.bank_reconciliations
FOR DELETE
USING (
  public.strict_company_check(company_id)
  AND public.is_admin(auth.uid())
);