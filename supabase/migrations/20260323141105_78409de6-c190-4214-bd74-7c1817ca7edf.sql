
-- ============================================
-- Composite Indexes for Critical Tables
-- Fixes: Missing index strategy (Audit Finding C4)
-- ============================================

-- Journal Entry Lines: Most queried table for financial reports
CREATE INDEX IF NOT EXISTS idx_jel_company_account 
  ON public.journal_entry_lines(company_id, account_id);

CREATE INDEX IF NOT EXISTS idx_jel_company_date 
  ON public.journal_entry_lines(company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_jel_entry_id 
  ON public.journal_entry_lines(journal_entry_id);

-- Journal Entries: Fiscal year isolation queries
CREATE INDEX IF NOT EXISTS idx_je_company_fiscal 
  ON public.journal_entries(company_id, fiscal_year_id);

CREATE INDEX IF NOT EXISTS idx_je_company_date 
  ON public.journal_entries(company_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_je_reference 
  ON public.journal_entries(company_id, reference_type, reference_id);

-- Invoices: Core business document queries
CREATE INDEX IF NOT EXISTS idx_invoices_company_type_status 
  ON public.invoices(company_id, invoice_type, status);

CREATE INDEX IF NOT EXISTS idx_invoices_company_fiscal 
  ON public.invoices(company_id, fiscal_year_id);

CREATE INDEX IF NOT EXISTS idx_invoices_company_date 
  ON public.invoices(company_id, invoice_date);

-- Account Categories: Chart of accounts lookup
CREATE INDEX IF NOT EXISTS idx_accounts_company_code 
  ON public.account_categories(company_id, code);

CREATE INDEX IF NOT EXISTS idx_accounts_company_type 
  ON public.account_categories(company_id, type);

-- Cars: Inventory queries (car dealership module)
CREATE INDEX IF NOT EXISTS idx_cars_company_status 
  ON public.cars(company_id, status);

CREATE INDEX IF NOT EXISTS idx_cars_company_fiscal 
  ON public.cars(company_id, fiscal_year_id);

-- Audit Logs: Security monitoring queries
CREATE INDEX IF NOT EXISTS idx_audit_company_date 
  ON public.audit_logs(company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_company_entity 
  ON public.audit_logs(company_id, entity_type, action);

-- Expenses: Financial reporting
CREATE INDEX IF NOT EXISTS idx_expenses_company_date 
  ON public.expenses(company_id, expense_date);

-- Sales: Car dealership reporting
CREATE INDEX IF NOT EXISTS idx_sales_company_date 
  ON public.sales(company_id, sale_date);

-- Account Mappings: Account resolution lookups
CREATE INDEX IF NOT EXISTS idx_mappings_company_key 
  ON public.account_mappings(company_id, mapping_key);

-- Customers & Suppliers: Lookup queries
CREATE INDEX IF NOT EXISTS idx_customers_company 
  ON public.customers(company_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_company 
  ON public.suppliers(company_id);

-- Checks: Financial tracking
CREATE INDEX IF NOT EXISTS idx_checks_company_status 
  ON public.checks(company_id, status, due_date);

-- Vouchers: Financial tracking
CREATE INDEX IF NOT EXISTS idx_vouchers_company_date 
  ON public.vouchers(company_id, voucher_date);

-- Profiles: User-company lookup
CREATE INDEX IF NOT EXISTS idx_profiles_company 
  ON public.profiles(company_id);
