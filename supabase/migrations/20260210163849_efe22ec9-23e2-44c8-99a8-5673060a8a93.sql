
-- Fix remaining "Company isolation select" policies for super_admin access

DROP POLICY IF EXISTS "Company isolation select" ON public.fixed_assets;
CREATE POLICY "Company isolation select" ON public.fixed_assets
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id());

DROP POLICY IF EXISTS "Company isolation select" ON public.depreciation_entries;
CREATE POLICY "Company isolation select" ON public.depreciation_entries
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id());

DROP POLICY IF EXISTS "Company isolation select" ON public.bank_accounts;
CREATE POLICY "Company isolation select" ON public.bank_accounts
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id());

DROP POLICY IF EXISTS "Company isolation select" ON public.vouchers;
CREATE POLICY "Company isolation select" ON public.vouchers
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id());

DROP POLICY IF EXISTS "Company isolation select" ON public.quotations;
CREATE POLICY "Company isolation select" ON public.quotations
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id());

DROP POLICY IF EXISTS "Company isolation select" ON public.account_categories;
CREATE POLICY "Company isolation select" ON public.account_categories
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id());

DROP POLICY IF EXISTS "Company isolation select" ON public.fiscal_years;
CREATE POLICY "Company isolation select" ON public.fiscal_years
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id());

DROP POLICY IF EXISTS "Company isolation select" ON public.backups;
CREATE POLICY "Company isolation select" ON public.backups
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id());
