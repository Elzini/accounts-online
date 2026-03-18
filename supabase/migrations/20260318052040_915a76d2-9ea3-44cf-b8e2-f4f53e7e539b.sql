-- Fix: Allow purchases role users to SELECT from suppliers table (via suppliers_safe view)
CREATE POLICY "Purchases users can view suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (strict_company_check(company_id) AND rbac_check('purchases'::text));
