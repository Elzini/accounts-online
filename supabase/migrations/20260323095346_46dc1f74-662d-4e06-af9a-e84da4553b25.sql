
-- =====================================================
-- Migration 1: Add critical composite indexes
-- Improves query performance for multi-tenant operations
-- =====================================================

-- journal_entry_lines: Add index on account_id + journal_entry_id (most queried)
CREATE INDEX IF NOT EXISTS idx_jel_account_entry ON public.journal_entry_lines(account_id, journal_entry_id);

-- journal_entry_lines: cost_center filtering
CREATE INDEX IF NOT EXISTS idx_jel_cost_center ON public.journal_entry_lines(cost_center_id) WHERE cost_center_id IS NOT NULL;

-- journal_entries: reference lookup (used by posting engine)
CREATE INDEX IF NOT EXISTS idx_je_company_reference ON public.journal_entries(company_id, reference_type, reference_id);

-- journal_entries: fiscal year + posted status (used by all reports)
CREATE INDEX IF NOT EXISTS idx_je_company_fiscal_posted ON public.journal_entries(company_id, fiscal_year_id, is_posted);

-- invoices: type + fiscal year (used by stats, reports)
CREATE INDEX IF NOT EXISTS idx_invoices_company_type ON public.invoices(company_id, invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_fiscal_year ON public.invoices(company_id, fiscal_year_id);

-- expenses: company + fiscal year filtering
CREATE INDEX IF NOT EXISTS idx_expenses_company_fiscal ON public.expenses(company_id, fiscal_year_id);

-- payroll_records: company + status (used by stats)
CREATE INDEX IF NOT EXISTS idx_payroll_company_status ON public.payroll_records(company_id, status);

-- bank_accounts: company (frequently joined)
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company ON public.bank_accounts(company_id);

-- bank_statements: company (frequently queried)
CREATE INDEX IF NOT EXISTS idx_bank_statements_company ON public.bank_statements(company_id);

-- bank_transactions: statement + date (frequent filtering)
CREATE INDEX IF NOT EXISTS idx_bank_tx_statement_date ON public.bank_transactions(statement_id, transaction_date);

-- checks: company + type + status (common filter combo)
CREATE INDEX IF NOT EXISTS idx_checks_company_type_status ON public.checks(company_id, check_type, status);

-- fiscal_years: company + current (used everywhere)
CREATE INDEX IF NOT EXISTS idx_fiscal_years_company_current ON public.fiscal_years(company_id, is_current);

-- tax_settings: company + active (used by invoice engine)
CREATE INDEX IF NOT EXISTS idx_tax_settings_company_active ON public.tax_settings(company_id, is_active);

-- account_mappings: company + active + type (used by account resolver)
CREATE INDEX IF NOT EXISTS idx_account_mappings_company_active ON public.account_mappings(company_id, is_active, mapping_type);

-- vouchers: company + type (common filter)
CREATE INDEX IF NOT EXISTS idx_vouchers_company_type ON public.vouchers(company_id, voucher_type);

-- sale_items: sale_id (child table, frequently joined)
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);

-- quotation_items: quotation_id (child table)
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.quotation_items(quotation_id);
