
-- Fix tasks.company_id type from text to uuid
ALTER TABLE public.tasks ALTER COLUMN company_id TYPE uuid USING company_id::uuid;

-- Create overloaded strict_company_check for text (fallback)
CREATE OR REPLACE FUNCTION public.strict_company_check(_company_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT strict_company_check(_company_id::uuid)
$$;

-- ============================================================
-- STRICT TENANT ISOLATION: Add strict_company_check to ALL 53 tables
-- ============================================================

-- Financial Core
CREATE POLICY "strict_isolation" ON public.account_mappings FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.budgets FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.budget_lines FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.checks FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.currencies FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.exchange_rates FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.expense_categories FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.financial_statement_config FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.tax_settings FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Operations
CREATE POLICY "strict_isolation" ON public.branches FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.car_transfers FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.custodies FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.custody_transactions FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.partner_dealerships FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.purchase_batches FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- HR & Payroll
CREATE POLICY "strict_isolation" ON public.employees FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.employee_advances FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.employee_attendance FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.employee_insurance FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.employee_leaves FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.employee_rewards FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.payroll_records FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Banking & Backups
CREATE POLICY "strict_isolation" ON public.bank_accounts FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.backup_schedules FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.backups FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Accounting & Journals
CREATE POLICY "strict_isolation" ON public.journal_attachments FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.journal_entry_rules FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.formula_definitions FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.formula_variables FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.custom_reports FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.trial_balance_imports FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Assets & Depreciation
CREATE POLICY "strict_isolation" ON public.asset_categories FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.depreciation_entries FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.prepaid_expenses FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Documents & Notifications
CREATE POLICY "strict_isolation" ON public.document_attachments FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.notifications FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.imported_invoice_data FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Approvals
CREATE POLICY "strict_isolation" ON public.approval_requests FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.approval_workflows FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Configuration
CREATE POLICY "strict_isolation" ON public.app_settings FOR ALL USING (company_id IS NULL OR strict_company_check(company_id)) WITH CHECK (company_id IS NULL OR strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.company_accounting_settings FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.dashboard_config FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.integration_configs FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.menu_configuration FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Manufacturing & Projects
CREATE POLICY "strict_isolation" ON public.manufacturing_products FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.production_orders FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.progress_billings FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.financing_companies FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Profiles & Sessions & Audit
CREATE POLICY "strict_isolation" ON public.profiles FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.user_sessions FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "strict_isolation" ON public.audit_logs FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Tasks
CREATE POLICY "strict_isolation" ON public.tasks FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Tenant Resources
CREATE POLICY "strict_isolation" ON public.tenant_resource_quotas FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
