
-- =============================================
-- Fix: Change all {public} role policies to {authenticated}
-- on account_categories, cars, checks, custodies, customers, journal_entry_lines
-- =============================================

-- 1. account_categories
DROP POLICY IF EXISTS "Manage accounts in company" ON public.account_categories;
CREATE POLICY "Manage accounts in company" ON public.account_categories
FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR ((company_id = get_user_company_id(auth.uid())) AND is_admin(auth.uid())));

-- 2. cars
DROP POLICY IF EXISTS "cars_select_authorized" ON public.cars;
DROP POLICY IF EXISTS "cars_insert_authorized" ON public.cars;
DROP POLICY IF EXISTS "cars_update_authorized" ON public.cars;
DROP POLICY IF EXISTS "cars_delete_authorized" ON public.cars;

CREATE POLICY "cars_select_authorized" ON public.cars
FOR SELECT TO authenticated
USING ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (has_permission('purchases') OR has_permission('sales') OR has_permission('admin') OR is_super_admin(auth.uid())));

CREATE POLICY "cars_insert_authorized" ON public.cars
FOR INSERT TO authenticated
WITH CHECK ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (has_permission('purchases') OR has_permission('admin') OR is_super_admin(auth.uid())));

CREATE POLICY "cars_update_authorized" ON public.cars
FOR UPDATE TO authenticated
USING ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (has_permission('purchases') OR has_permission('sales') OR has_permission('admin') OR is_super_admin(auth.uid())))
WITH CHECK ((auth.uid() IS NOT NULL) AND strict_company_check(company_id));

CREATE POLICY "cars_delete_authorized" ON public.cars
FOR DELETE TO authenticated
USING ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (has_permission('admin') OR is_super_admin(auth.uid())));

-- 3. checks
DROP POLICY IF EXISTS "Admin/purchases can view checks" ON public.checks;
DROP POLICY IF EXISTS "Admin/purchases can insert checks" ON public.checks;
DROP POLICY IF EXISTS "Admin/purchases can update checks" ON public.checks;
DROP POLICY IF EXISTS "Admin can delete checks" ON public.checks;

CREATE POLICY "Admin/purchases can view checks" ON public.checks
FOR SELECT TO authenticated
USING ((company_id = get_user_company_id(auth.uid())) AND (is_admin(auth.uid()) OR has_permission(auth.uid(), 'purchases'::user_permission)));

CREATE POLICY "Admin/purchases can insert checks" ON public.checks
FOR INSERT TO authenticated
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND (is_admin(auth.uid()) OR has_permission(auth.uid(), 'purchases'::user_permission)));

CREATE POLICY "Admin/purchases can update checks" ON public.checks
FOR UPDATE TO authenticated
USING ((company_id = get_user_company_id(auth.uid())) AND (is_admin(auth.uid()) OR has_permission(auth.uid(), 'purchases'::user_permission)));

CREATE POLICY "Admin can delete checks" ON public.checks
FOR DELETE TO authenticated
USING ((company_id = get_user_company_id(auth.uid())) AND is_admin(auth.uid()));

-- 4. custodies
DROP POLICY IF EXISTS "View custodies in company" ON public.custodies;
DROP POLICY IF EXISTS "Insert custodies in company" ON public.custodies;
DROP POLICY IF EXISTS "Update custodies in company" ON public.custodies;
DROP POLICY IF EXISTS "Delete custodies in company" ON public.custodies;
DROP POLICY IF EXISTS "strict_isolation" ON public.custodies;

CREATE POLICY "View custodies in company" ON public.custodies
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Insert custodies in company" ON public.custodies
FOR INSERT TO authenticated
WITH CHECK (is_super_admin(auth.uid()) OR ((company_id = get_user_company_id(auth.uid())) AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))));

CREATE POLICY "Update custodies in company" ON public.custodies
FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()) OR ((company_id = get_user_company_id(auth.uid())) AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))));

CREATE POLICY "Delete custodies in company" ON public.custodies
FOR DELETE TO authenticated
USING (is_super_admin(auth.uid()) OR ((company_id = get_user_company_id(auth.uid())) AND is_admin(auth.uid())));

-- 5. customers
DROP POLICY IF EXISTS "customers_select_granular" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_granular" ON public.customers;
DROP POLICY IF EXISTS "customers_update_granular" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_admin_only" ON public.customers;

CREATE POLICY "customers_select_granular" ON public.customers
FOR SELECT TO authenticated
USING ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (is_super_admin(auth.uid()) OR has_permission('admin') OR (has_permission('sales') AND ((managed_by = auth.uid()) OR (managed_by IS NULL)))));

CREATE POLICY "customers_insert_granular" ON public.customers
FOR INSERT TO authenticated
WITH CHECK ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (has_permission('sales') OR has_permission('admin') OR is_super_admin(auth.uid())));

CREATE POLICY "customers_update_granular" ON public.customers
FOR UPDATE TO authenticated
USING ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (is_super_admin(auth.uid()) OR has_permission('admin') OR (has_permission('sales') AND (managed_by = auth.uid()))))
WITH CHECK ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (is_super_admin(auth.uid()) OR has_permission('admin') OR (has_permission('sales') AND (managed_by = auth.uid()))));

CREATE POLICY "customers_delete_admin_only" ON public.customers
FOR DELETE TO authenticated
USING ((auth.uid() IS NOT NULL) AND strict_company_check(company_id) AND (has_permission('admin') OR is_super_admin(auth.uid())));

-- 6. journal_entry_lines
DROP POLICY IF EXISTS "Manage entry lines via journal" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "View entry lines via journal" ON public.journal_entry_lines;

CREATE POLICY "Manage entry lines via journal" ON public.journal_entry_lines
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM journal_entries je WHERE je.id = journal_entry_id AND je.company_id = get_user_company_id(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM journal_entries je WHERE je.id = journal_entry_id AND je.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "View entry lines via journal" ON public.journal_entry_lines
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM journal_entries je WHERE je.id = journal_entry_id AND je.company_id = get_user_company_id(auth.uid())));
