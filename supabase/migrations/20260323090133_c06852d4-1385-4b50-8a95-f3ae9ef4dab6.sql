
-- Performance indexes for most-queried tables
-- Journal entries (core accounting)
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_date ON journal_entries(company_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_fiscal_year ON journal_entries(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);

-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON sales(company_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_fiscal_year ON sales(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_sales_car ON sales(car_id);

-- Cars
CREATE INDEX IF NOT EXISTS idx_cars_company_status ON cars(company_id, status);
CREATE INDEX IF NOT EXISTS idx_cars_fiscal_year ON cars(fiscal_year_id);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_company_date ON expenses(company_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_car ON expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_company_date ON invoices(company_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Customers & Suppliers
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);

-- Notifications (queried on every page load)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Account categories
CREATE INDEX IF NOT EXISTS idx_account_categories_company_type ON account_categories(company_id, type);

-- Checks
CREATE INDEX IF NOT EXISTS idx_checks_company_status ON checks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_checks_due_date ON checks(company_id, due_date);

-- Car transfers
CREATE INDEX IF NOT EXISTS idx_car_transfers_company ON car_transfers(company_id);
CREATE INDEX IF NOT EXISTS idx_car_transfers_car ON car_transfers(car_id);
