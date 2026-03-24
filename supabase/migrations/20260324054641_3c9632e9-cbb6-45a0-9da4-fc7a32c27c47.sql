
-- ============================================================
-- Phase 1: Consolidate RLS Policies on 15 bloated tables
-- Pattern: Keep strict_isolation + super_admin, drop legacy duplicates
-- ============================================================

-- === account_categories (8 → 3 policies) ===
DROP POLICY IF EXISTS "Company isolation delete" ON public.account_categories;
DROP POLICY IF EXISTS "Company isolation insert" ON public.account_categories;
DROP POLICY IF EXISTS "Company isolation select" ON public.account_categories;
DROP POLICY IF EXISTS "Company isolation update" ON public.account_categories;
DROP POLICY IF EXISTS "Insert account categories in company" ON public.account_categories;
DROP POLICY IF EXISTS "View accounts in company" ON public.account_categories;
-- Keep: "Manage accounts in company" (admin+super_admin ALL) + "account_categories_strict_isolation"

-- === depreciation_entries (9 → 2 policies) ===
DROP POLICY IF EXISTS "Company isolation delete" ON public.depreciation_entries;
DROP POLICY IF EXISTS "Company isolation insert" ON public.depreciation_entries;
DROP POLICY IF EXISTS "Company isolation select" ON public.depreciation_entries;
DROP POLICY IF EXISTS "Company isolation update" ON public.depreciation_entries;
DROP POLICY IF EXISTS "Users can delete depreciation entries in their company" ON public.depreciation_entries;
DROP POLICY IF EXISTS "Users can insert depreciation entries in their company" ON public.depreciation_entries;
DROP POLICY IF EXISTS "Users can update depreciation entries in their company" ON public.depreciation_entries;
DROP POLICY IF EXISTS "Users can view depreciation entries in their company" ON public.depreciation_entries;
-- Keep: "strict_isolation"

-- === fixed_assets (9 → 2 policies) ===
DROP POLICY IF EXISTS "Company isolation delete" ON public.fixed_assets;
DROP POLICY IF EXISTS "Company isolation insert" ON public.fixed_assets;
DROP POLICY IF EXISTS "Company isolation select" ON public.fixed_assets;
DROP POLICY IF EXISTS "Company isolation update" ON public.fixed_assets;
DROP POLICY IF EXISTS "Users can delete fixed assets in their company" ON public.fixed_assets;
DROP POLICY IF EXISTS "Users can insert fixed assets in their company" ON public.fixed_assets;
DROP POLICY IF EXISTS "Users can update fixed assets in their company" ON public.fixed_assets;
DROP POLICY IF EXISTS "Users can view fixed assets in their company" ON public.fixed_assets;
-- Keep: "fixed_assets_strict_isolation"

-- === journal_entries (9 → 2 policies) ===
DROP POLICY IF EXISTS "Company isolation delete" ON public.journal_entries;
DROP POLICY IF EXISTS "Company isolation insert" ON public.journal_entries;
DROP POLICY IF EXISTS "Company isolation select" ON public.journal_entries;
DROP POLICY IF EXISTS "Company isolation update" ON public.journal_entries;
DROP POLICY IF EXISTS "Delete journal entries in company" ON public.journal_entries;
DROP POLICY IF EXISTS "Insert journal entries in company" ON public.journal_entries;
DROP POLICY IF EXISTS "Update journal entries in company" ON public.journal_entries;
DROP POLICY IF EXISTS "View journal entries in company" ON public.journal_entries;
-- Keep: "journal_entries_strict_isolation"

-- === sales (9 → 2 policies) ===
DROP POLICY IF EXISTS "Company isolation delete" ON public.sales;
DROP POLICY IF EXISTS "Company isolation insert" ON public.sales;
DROP POLICY IF EXISTS "Company isolation select" ON public.sales;
DROP POLICY IF EXISTS "Company isolation update" ON public.sales;
DROP POLICY IF EXISTS "Delete sales in company" ON public.sales;
DROP POLICY IF EXISTS "Insert sales in company" ON public.sales;
DROP POLICY IF EXISTS "Update sales in company" ON public.sales;
DROP POLICY IF EXISTS "View sales in company" ON public.sales;
-- Keep: "sales_strict_isolation"

-- === vouchers (9 → 2 policies) ===
DROP POLICY IF EXISTS "Company isolation delete" ON public.vouchers;
DROP POLICY IF EXISTS "Company isolation insert" ON public.vouchers;
DROP POLICY IF EXISTS "Company isolation select" ON public.vouchers;
DROP POLICY IF EXISTS "Company isolation update" ON public.vouchers;
DROP POLICY IF EXISTS "Delete vouchers in company" ON public.vouchers;
DROP POLICY IF EXISTS "Insert vouchers in company" ON public.vouchers;
DROP POLICY IF EXISTS "Update vouchers in company" ON public.vouchers;
DROP POLICY IF EXISTS "View vouchers in company" ON public.vouchers;
-- Keep: "vouchers_strict_isolation"

-- === expenses (9 → 2 policies) ===
DROP POLICY IF EXISTS "Delete expenses in company" ON public.expenses;
DROP POLICY IF EXISTS "Insert expenses in company" ON public.expenses;
DROP POLICY IF EXISTS "Update expenses in company" ON public.expenses;
DROP POLICY IF EXISTS "View expenses in company" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own company expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own company expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own company expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view own company expenses" ON public.expenses;
-- Keep: "expenses_strict_isolation"

-- === fiscal_years (8 → 2 policies) ===
DROP POLICY IF EXISTS "Company isolation delete" ON public.fiscal_years;
DROP POLICY IF EXISTS "Company isolation insert" ON public.fiscal_years;
DROP POLICY IF EXISTS "Company isolation select" ON public.fiscal_years;
DROP POLICY IF EXISTS "Company isolation update" ON public.fiscal_years;
DROP POLICY IF EXISTS "Authenticated users can read fiscal years" ON public.fiscal_years;
DROP POLICY IF EXISTS "Insert fiscal years - admins only" ON public.fiscal_years;
DROP POLICY IF EXISTS "Manage fiscal years - admins only" ON public.fiscal_years;
-- Keep: "fiscal_years_strict_isolation"

-- === expense_categories (8 → 2 policies) ===
DROP POLICY IF EXISTS "Insert expense categories in company" ON public.expense_categories;
DROP POLICY IF EXISTS "Manage expense_categories in company" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete own company expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can insert own company expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update own company expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view own company expense categories" ON public.expense_categories;
-- Keep: remaining strict policies

-- === tax_settings (8 → 2 policies) ===
DROP POLICY IF EXISTS "Insert tax settings in company" ON public.tax_settings;
DROP POLICY IF EXISTS "Manage tax settings in company" ON public.tax_settings;
DROP POLICY IF EXISTS "Tax settings secure insert" ON public.tax_settings;
DROP POLICY IF EXISTS "Tax settings secure select" ON public.tax_settings;
DROP POLICY IF EXISTS "Tax settings secure update" ON public.tax_settings;
DROP POLICY IF EXISTS "View tax settings in company - admin only" ON public.tax_settings;
-- Keep: "strict_isolation" + "tax_settings_strict_isolation"

-- === bank_accounts: Remove legacy, keep admin+super_admin ===
DROP POLICY IF EXISTS "Bank accounts secure delete" ON public.bank_accounts;
DROP POLICY IF EXISTS "Bank accounts secure insert" ON public.bank_accounts;
DROP POLICY IF EXISTS "Bank accounts secure select" ON public.bank_accounts;
DROP POLICY IF EXISTS "Bank accounts secure update" ON public.bank_accounts;
-- Keep: admin_bank_accounts_* + super_admin_bank_accounts

-- ============================================================
-- Phase 2: Add unified super_admin policies where missing
-- ============================================================

-- Tables that lost super_admin access after cleanup:
CREATE POLICY "super_admin_depreciation_entries" ON public.depreciation_entries
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_fixed_assets" ON public.fixed_assets
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_journal_entries" ON public.journal_entries
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_sales" ON public.sales
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_vouchers" ON public.vouchers
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_expenses" ON public.expenses
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_fiscal_years" ON public.fiscal_years
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_expense_categories" ON public.expense_categories
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_tax_settings" ON public.tax_settings
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

-- ============================================================
-- Phase 3: Drop obsolete DB functions (no longer called from code)
-- These were replaced by InvoicePostingEngine
-- ============================================================

DROP FUNCTION IF EXISTS public.create_invoice_journal_entry CASCADE;
DROP FUNCTION IF EXISTS public.create_purchase_journal_entry CASCADE;
DROP FUNCTION IF EXISTS public.create_sale_journal_entry CASCADE;
DROP FUNCTION IF EXISTS public.create_expense_journal_entry CASCADE;
DROP FUNCTION IF EXISTS public.create_prepaid_expense_journal_entry CASCADE;
DROP FUNCTION IF EXISTS public.fix_missing_cogs_entries CASCADE;
DROP FUNCTION IF EXISTS public.regenerate_journal_entries CASCADE;
DROP FUNCTION IF EXISTS public.delete_orphan_journal_entry CASCADE;

-- Drop duplicate get_user_company_id (keep the one with uuid param)
-- Note: keeping both overloads as they serve different call patterns

-- Drop obsolete tenant sync functions (replaced by Core Engine)
DROP FUNCTION IF EXISTS public.sync_car_to_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_check_to_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_customer_to_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_expense_to_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_invoice_settings_to_defaults CASCADE;
DROP FUNCTION IF EXISTS public.sync_journal_entry_to_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_journal_line_to_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_sale_to_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_supplier_to_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_account_category_to_defaults CASCADE;
DROP FUNCTION IF EXISTS public.sync_car_to_tenant CASCADE;

-- Drop unused security functions
DROP FUNCTION IF EXISTS public.run_all_tenants_pentest CASCADE;
DROP FUNCTION IF EXISTS public.run_tenant_isolation_pentest CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_network_config CASCADE;
DROP FUNCTION IF EXISTS public.check_tenant_ip_access CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_tenant_schema CASCADE;
DROP FUNCTION IF EXISTS public.backfill_tenant_schema CASCADE;
