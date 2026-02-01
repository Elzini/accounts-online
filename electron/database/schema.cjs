/**
 * SQLite Database Schema
 * Mirrors the Supabase cloud database structure for offline support
 */

const SCHEMA = `
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- Core Tables
-- ============================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  invoice_logo_url TEXT,
  invoice_settings TEXT, -- JSON
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('sales', 'purchases', 'reports', 'admin', 'users', 'super_admin')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, permission)
);

-- ============================================
-- Business Tables
-- ============================================

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  id_number TEXT,
  registration_number TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Fiscal years table
CREATE TABLE IF NOT EXISTS fiscal_years (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_current INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  closed_at TEXT,
  closed_by TEXT,
  opening_balance_entry_id TEXT,
  closing_balance_entry_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT REFERENCES companies(id),
  inventory_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  chassis_number TEXT NOT NULL,
  model TEXT,
  color TEXT,
  purchase_price REAL NOT NULL,
  purchase_date TEXT DEFAULT (date('now')),
  status TEXT DEFAULT 'available',
  supplier_id TEXT REFERENCES suppliers(id),
  fiscal_year_id TEXT REFERENCES fiscal_years(id),
  batch_id TEXT,
  payment_account_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT REFERENCES companies(id),
  invoice_number INTEGER NOT NULL,
  car_id TEXT REFERENCES cars(id),
  customer_id TEXT REFERENCES customers(id),
  sale_price REAL NOT NULL,
  sale_date TEXT DEFAULT (date('now')),
  payment_method TEXT DEFAULT 'cash',
  profit REAL DEFAULT 0,
  notes TEXT,
  commission REAL DEFAULT 0,
  vat_amount REAL DEFAULT 0,
  is_vat_included INTEGER DEFAULT 0,
  fiscal_year_id TEXT REFERENCES fiscal_years(id),
  payment_account_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  expense_date TEXT DEFAULT (date('now')),
  category_id TEXT,
  car_id TEXT REFERENCES cars(id),
  account_id TEXT,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  has_vat_invoice INTEGER DEFAULT 0,
  fiscal_year_id TEXT REFERENCES fiscal_years(id),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Accounting Tables
-- ============================================

-- Account categories (Chart of Accounts)
CREATE TABLE IF NOT EXISTS account_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parent_id TEXT REFERENCES account_categories(id),
  description TEXT,
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  entry_number INTEGER NOT NULL,
  entry_date TEXT NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  is_auto_generated INTEGER DEFAULT 0,
  is_opening_balance INTEGER DEFAULT 0,
  is_closing_balance INTEGER DEFAULT 0,
  fiscal_year_id TEXT REFERENCES fiscal_years(id),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Journal entry lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES account_categories(id),
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  voucher_number INTEGER NOT NULL,
  voucher_type TEXT NOT NULL,
  voucher_date TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  from_account_id TEXT REFERENCES account_categories(id),
  to_account_id TEXT REFERENCES account_categories(id),
  fiscal_year_id TEXT REFERENCES fiscal_years(id),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Settings Tables
-- ============================================

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT REFERENCES companies(id),
  key TEXT NOT NULL,
  value TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(company_id, key)
);

-- Tax settings
CREATE TABLE IF NOT EXISTS tax_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  tax_name TEXT NOT NULL,
  tax_rate REAL NOT NULL,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Company accounting settings
CREATE TABLE IF NOT EXISTS company_accounting_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL UNIQUE REFERENCES companies(id),
  auto_journal_entries_enabled INTEGER DEFAULT 0,
  auto_sales_entries INTEGER DEFAULT 0,
  auto_purchase_entries INTEGER DEFAULT 0,
  auto_expense_entries INTEGER DEFAULT 0,
  sales_revenue_account_id TEXT,
  sales_cash_account_id TEXT,
  purchase_inventory_account_id TEXT,
  purchase_cash_account_id TEXT,
  expense_account_id TEXT,
  expense_cash_account_id TEXT,
  cogs_account_id TEXT,
  inventory_account_id TEXT,
  suppliers_account_id TEXT,
  vat_payable_account_id TEXT,
  vat_recoverable_account_id TEXT,
  vat_settlement_account_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Menu configuration
CREATE TABLE IF NOT EXISTS menu_configuration (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  menu_key TEXT NOT NULL,
  is_visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  custom_label TEXT,
  icon TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(company_id, menu_key)
);

-- Dashboard config
CREATE TABLE IF NOT EXISTS dashboard_config (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL UNIQUE REFERENCES companies(id),
  stat_cards TEXT DEFAULT '[]', -- JSON
  layout_settings TEXT DEFAULT '{}', -- JSON
  analytics_settings TEXT DEFAULT '{}', -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Partner & Transfers Tables
-- ============================================

-- Partner dealerships
CREATE TABLE IF NOT EXISTS partner_dealerships (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  commission_rate REAL DEFAULT 0,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Car transfers
CREATE TABLE IF NOT EXISTS car_transfers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT REFERENCES companies(id),
  car_id TEXT NOT NULL REFERENCES cars(id),
  partner_dealership_id TEXT NOT NULL REFERENCES partner_dealerships(id),
  transfer_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transfer_date TEXT DEFAULT (date('now')),
  return_date TEXT,
  sale_id TEXT REFERENCES sales(id),
  sale_price REAL,
  commission_percentage REAL,
  agreed_commission REAL,
  actual_commission REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Employees & Payroll Tables
-- ============================================

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  employee_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  phone TEXT,
  id_number TEXT,
  base_salary REAL DEFAULT 0,
  housing_allowance REAL DEFAULT 0,
  transport_allowance REAL DEFAULT 0,
  hire_date TEXT,
  bank_name TEXT,
  iban TEXT,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Employee advances
CREATE TABLE IF NOT EXISTS employee_advances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  amount REAL NOT NULL,
  advance_date TEXT DEFAULT (date('now')),
  reason TEXT,
  is_deducted INTEGER DEFAULT 0,
  deducted_in_payroll_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payroll records
CREATE TABLE IF NOT EXISTS payroll_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  base_salary REAL DEFAULT 0,
  housing_allowance REAL DEFAULT 0,
  transport_allowance REAL DEFAULT 0,
  other_allowances REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  advances_deducted REAL DEFAULT 0,
  net_salary REAL DEFAULT 0,
  payment_date TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Financing Tables
-- ============================================

-- Financing companies
CREATE TABLE IF NOT EXISTS financing_companies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  bank_name TEXT,
  commission_rate REAL,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Financing contracts
CREATE TABLE IF NOT EXISTS financing_contracts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  contract_number TEXT NOT NULL,
  financing_company_id TEXT NOT NULL REFERENCES financing_companies(id),
  customer_id TEXT REFERENCES customers(id),
  car_id TEXT REFERENCES cars(id),
  sale_id TEXT REFERENCES sales(id),
  contract_date TEXT DEFAULT (date('now')),
  financed_amount REAL NOT NULL,
  down_payment REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  profit_rate REAL DEFAULT 0,
  number_of_months INTEGER NOT NULL,
  monthly_payment REAL NOT NULL,
  first_payment_date TEXT NOT NULL,
  last_payment_date TEXT,
  amount_received_from_bank REAL,
  bank_transfer_date TEXT,
  bank_reference TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Quotations Tables
-- ============================================

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  quotation_number INTEGER NOT NULL,
  customer_id TEXT REFERENCES customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  quotation_date TEXT DEFAULT (date('now')),
  valid_until TEXT,
  total_amount REAL DEFAULT 0,
  vat_amount REAL DEFAULT 0,
  grand_total REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Quotation items
CREATE TABLE IF NOT EXISTS quotation_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  car_id TEXT REFERENCES cars(id),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Installment Sales Tables
-- ============================================

-- Installment sales
CREATE TABLE IF NOT EXISTS installment_sales (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  sale_id TEXT REFERENCES sales(id),
  customer_id TEXT REFERENCES customers(id),
  car_id TEXT REFERENCES cars(id),
  total_amount REAL NOT NULL,
  down_payment REAL DEFAULT 0,
  remaining_amount REAL NOT NULL,
  number_of_installments INTEGER NOT NULL,
  installment_amount REAL NOT NULL,
  start_date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Installment payments
CREATE TABLE IF NOT EXISTS installment_payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  installment_sale_id TEXT NOT NULL REFERENCES installment_sales(id),
  payment_number INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  amount REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  paid_date TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Banking Tables
-- ============================================

-- Bank accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  swift_code TEXT,
  opening_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  account_category_id TEXT REFERENCES account_categories(id),
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Sync Tracking Table
-- ============================================

-- Sync log for tracking changes
CREATE TABLE IF NOT EXISTS _sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data TEXT, -- JSON of the record
  synced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT
);

-- Create index for faster sync queries
CREATE INDEX IF NOT EXISTS idx_sync_log_unsynced ON _sync_log(synced) WHERE synced = 0;

-- ============================================
-- Triggers for Sync Tracking
-- ============================================

-- Trigger for customers INSERT
CREATE TRIGGER IF NOT EXISTS trg_customers_insert AFTER INSERT ON customers
BEGIN
  INSERT INTO _sync_log (table_name, record_id, operation, data)
  VALUES ('customers', NEW.id, 'INSERT', json_object(
    'id', NEW.id, 'company_id', NEW.company_id, 'name', NEW.name,
    'phone', NEW.phone, 'address', NEW.address, 'id_number', NEW.id_number
  ));
END;

-- Trigger for customers UPDATE
CREATE TRIGGER IF NOT EXISTS trg_customers_update AFTER UPDATE ON customers
BEGIN
  INSERT INTO _sync_log (table_name, record_id, operation, data)
  VALUES ('customers', NEW.id, 'UPDATE', json_object(
    'id', NEW.id, 'company_id', NEW.company_id, 'name', NEW.name,
    'phone', NEW.phone, 'address', NEW.address, 'id_number', NEW.id_number
  ));
END;

-- Trigger for sales INSERT
CREATE TRIGGER IF NOT EXISTS trg_sales_insert AFTER INSERT ON sales
BEGIN
  INSERT INTO _sync_log (table_name, record_id, operation, data)
  VALUES ('sales', NEW.id, 'INSERT', json_object(
    'id', NEW.id, 'company_id', NEW.company_id, 'invoice_number', NEW.invoice_number,
    'car_id', NEW.car_id, 'customer_id', NEW.customer_id, 'sale_price', NEW.sale_price,
    'sale_date', NEW.sale_date, 'profit', NEW.profit
  ));
END;

-- Trigger for sales UPDATE
CREATE TRIGGER IF NOT EXISTS trg_sales_update AFTER UPDATE ON sales
BEGIN
  INSERT INTO _sync_log (table_name, record_id, operation, data)
  VALUES ('sales', NEW.id, 'UPDATE', json_object(
    'id', NEW.id, 'company_id', NEW.company_id, 'invoice_number', NEW.invoice_number,
    'car_id', NEW.car_id, 'customer_id', NEW.customer_id, 'sale_price', NEW.sale_price,
    'sale_date', NEW.sale_date, 'profit', NEW.profit
  ));
END;

-- Trigger for cars INSERT
CREATE TRIGGER IF NOT EXISTS trg_cars_insert AFTER INSERT ON cars
BEGIN
  INSERT INTO _sync_log (table_name, record_id, operation, data)
  VALUES ('cars', NEW.id, 'INSERT', json_object(
    'id', NEW.id, 'company_id', NEW.company_id, 'inventory_number', NEW.inventory_number,
    'name', NEW.name, 'chassis_number', NEW.chassis_number, 'purchase_price', NEW.purchase_price,
    'status', NEW.status
  ));
END;

-- Trigger for cars UPDATE
CREATE TRIGGER IF NOT EXISTS trg_cars_update AFTER UPDATE ON cars
BEGIN
  INSERT INTO _sync_log (table_name, record_id, operation, data)
  VALUES ('cars', NEW.id, 'UPDATE', json_object(
    'id', NEW.id, 'company_id', NEW.company_id, 'inventory_number', NEW.inventory_number,
    'name', NEW.name, 'chassis_number', NEW.chassis_number, 'purchase_price', NEW.purchase_price,
    'status', NEW.status
  ));
END;

-- Trigger for expenses INSERT
CREATE TRIGGER IF NOT EXISTS trg_expenses_insert AFTER INSERT ON expenses
BEGIN
  INSERT INTO _sync_log (table_name, record_id, operation, data)
  VALUES ('expenses', NEW.id, 'INSERT', json_object(
    'id', NEW.id, 'company_id', NEW.company_id, 'description', NEW.description,
    'amount', NEW.amount, 'expense_date', NEW.expense_date
  ));
END;

-- Trigger for expenses UPDATE
CREATE TRIGGER IF NOT EXISTS trg_expenses_update AFTER UPDATE ON expenses
BEGIN
  INSERT INTO _sync_log (table_name, record_id, operation, data)
  VALUES ('expenses', NEW.id, 'UPDATE', json_object(
    'id', NEW.id, 'company_id', NEW.company_id, 'description', NEW.description,
    'amount', NEW.amount, 'expense_date', NEW.expense_date
  ));
END;
`;

module.exports = { SCHEMA };
