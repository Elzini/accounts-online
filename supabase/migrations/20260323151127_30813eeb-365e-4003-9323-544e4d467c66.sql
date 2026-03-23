
-- C4: Composite indexes for high-traffic queries
CREATE INDEX IF NOT EXISTS idx_je_company_posted ON public.journal_entries(company_id, is_posted);
CREATE INDEX IF NOT EXISTS idx_je_company_date ON public.journal_entries(company_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_je_company_ref ON public.journal_entries(company_id, reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_inv_company_type ON public.invoices(company_id, invoice_type);
CREATE INDEX IF NOT EXISTS idx_inv_company_type_date ON public.invoices(company_id, invoice_type, invoice_date);
CREATE INDEX IF NOT EXISTS idx_inv_company_status ON public.invoices(company_id, status);

CREATE INDEX IF NOT EXISTS idx_sales_company_date ON public.sales(company_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_company_status ON public.sales(company_id, status);

CREATE INDEX IF NOT EXISTS idx_cars_company_status ON public.cars(company_id, status);

CREATE INDEX IF NOT EXISTS idx_expenses_company_date ON public.expenses(company_id, expense_date);

CREATE INDEX IF NOT EXISTS idx_acct_company_type ON public.account_categories(company_id, type);
CREATE INDEX IF NOT EXISTS idx_acct_company_code ON public.account_categories(company_id, code);

CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON public.suppliers(company_id);

CREATE INDEX IF NOT EXISTS idx_inv_items_invoice ON public.invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_acct_map_company_key ON public.account_mappings(company_id, mapping_key);

CREATE INDEX IF NOT EXISTS idx_fy_company_current ON public.fiscal_years(company_id, is_current);

CREATE INDEX IF NOT EXISTS idx_jel_company ON public.journal_entry_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_jel_entry ON public.journal_entry_lines(journal_entry_id);
