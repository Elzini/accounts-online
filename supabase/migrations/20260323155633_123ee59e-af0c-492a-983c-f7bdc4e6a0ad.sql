
-- =============================================
-- Phase 3: Schema Cleanup + Performance Indexes
-- =============================================

-- 1. Drop truly unused tables (verified zero references in codebase)
DROP TABLE IF EXISTS public.tenant_encryption_keys CASCADE;
DROP TABLE IF EXISTS public.user_2fa CASCADE;

-- 2. Add composite indexes for hot-path tables
-- Journal entries (most critical for reports)
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_fiscal_date 
  ON public.journal_entries (company_id, fiscal_year_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_ref 
  ON public.journal_entries (company_id, reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_posted 
  ON public.journal_entries (company_id, is_posted, fiscal_year_id);

-- Journal entry lines (heavy join target)
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account 
  ON public.journal_entry_lines (account_id, journal_entry_id);

-- Invoices (high traffic)
CREATE INDEX IF NOT EXISTS idx_invoices_company_type_fiscal 
  ON public.invoices (company_id, invoice_type, fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_status 
  ON public.invoices (company_id, status, invoice_date);

-- Account categories (frequently joined)
CREATE INDEX IF NOT EXISTS idx_account_categories_company_code 
  ON public.account_categories (company_id, code);
CREATE INDEX IF NOT EXISTS idx_account_categories_company_type 
  ON public.account_categories (company_id, type);

-- Account mappings (loaded on every engine init)
CREATE INDEX IF NOT EXISTS idx_account_mappings_company_active 
  ON public.account_mappings (company_id, is_active);

-- Expenses (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_expenses_company_date 
  ON public.expenses (company_id, expense_date);

-- Cars (industry-specific but heavily queried)
CREATE INDEX IF NOT EXISTS idx_cars_company_status 
  ON public.cars (company_id, status);

-- Sales (industry-specific)
CREATE INDEX IF NOT EXISTS idx_sales_company_date 
  ON public.sales (company_id, sale_date);

-- Fiscal years (context loading)
CREATE INDEX IF NOT EXISTS idx_fiscal_years_company_current 
  ON public.fiscal_years (company_id, is_current);

-- Checks
CREATE INDEX IF NOT EXISTS idx_checks_company_status 
  ON public.checks (company_id, status, due_date);

-- Vouchers
CREATE INDEX IF NOT EXISTS idx_vouchers_company_date 
  ON public.vouchers (company_id, voucher_date);
