/**
 * Core Accounting Engine - Type Definitions
 * Industry-agnostic types for the accounting system
 */

// ============ Account Types ============
export type AccountType = 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';
export type ReferenceType = 'sale' | 'purchase' | 'manual' | 'adjustment' | 'opening' | 'closing' | 'invoice_purchase' | 'invoice_sale' | 'purchase_return';

export interface Account {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: AccountType;
  parent_id: string | null;
  is_system: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Journal Entry Types ============
export interface JournalEntryLine {
  account_id: string;
  description: string;
  debit: number;
  credit: number;
  cost_center_id?: string | null;
}

export interface JournalEntryInput {
  company_id: string;
  fiscal_year_id: string;
  entry_date: string;
  description: string;
  reference_type?: ReferenceType;
  reference_id?: string;
  is_posted?: boolean;
  lines: JournalEntryLine[];
}

export interface JournalEntryRecord extends JournalEntryInput {
  id: string;
  entry_number: number;
  total_debit: number;
  total_credit: number;
  created_at: string;
  updated_at: string;
}

// ============ Account Mapping Types ============
export interface AccountMapping {
  mapping_key: string;
  account_id: string;
}

/** Standard mapping keys used by the core engine */
export type StandardMappingKey =
  | 'cash'
  | 'sales_cash'
  | 'sales_revenue'
  | 'purchase_expense'
  | 'suppliers'
  | 'customers'
  | 'vat_input'
  | 'vat_output'
  | 'retained_earnings'
  | 'cost_of_sales';

// ============ Dashboard Stats ============
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  totalPurchases: number;
  netProfit: number;
  monthRevenue: number;
  monthExpenses: number;
  monthPurchases: number;
  monthProfit: number;
  todayTransactions: number;
  totalTransactions: number;
  purchasesCount: number;
  salesCount: number;
  payrollExpenses: number;
  /** Industry-specific extra data */
  extra: Record<string, any>;
}

// ============ Company Configuration ============
export interface CompanyConfig {
  id: string;
  name: string;
  company_type: string;
  is_active: boolean;
  /** Accounting settings */
  accounting: {
    auto_journal_entries: boolean;
    auto_purchase_entries: boolean;
    auto_sales_entries: boolean;
    valuation_method: 'fifo' | 'average' | 'specific';
  };
  /** Tax settings */
  tax: {
    tax_rate: number;
    tax_name: string;
    is_active: boolean;
    apply_to_sales: boolean;
    apply_to_purchases: boolean;
    tax_number: string | null;
  };
  /** Default account mappings */
  accountMappings: Map<string, string>;
}

// ============ Fiscal Year ============
export interface FiscalYear {
  id: string;
  company_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
}

// ============ Validation ============
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============ Module Registration ============
export interface IndustryModule {
  /** Unique module identifier */
  id: string;
  /** Display name */
  name: string;
  /** Which company_type values this module handles */
  supportedTypes: string[];
  /** Get dashboard stats for this industry */
  getDashboardStats(companyId: string, fiscalYearId?: string): Promise<Partial<DashboardStats>>;
  /** Get extra sidebar menu items */
  getMenuItems(): MenuItem[];
  /** Get COA template name */
  getCoaTemplate(): string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: MenuItem[];
}
