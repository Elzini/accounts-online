/**
 * Core Accounting Engine - Type Definitions
 * Industry-agnostic types for the accounting system
 */

// ============ Account Types ============
export type AccountType = 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';
export type ReferenceType = 'sale' | 'purchase' | 'manual' | 'adjustment' | 'opening' | 'closing' | 'invoice_purchase' | 'invoice_sale' | 'purchase_return' | 'voucher' | 'project_cost' | 'advance_payment' | 'unit_sale_revenue' | 'unit_sale_cogs' | 'expense';

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

export interface JournalEntryRecord {
  id: string;
  company_id: string;
  fiscal_year_id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  reference_type?: string | null;
  reference_id?: string | null;
  is_posted: boolean;
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

/** Configuration for an industry-specific posting rule */
export interface PostingRuleConfig {
  /** Account mapping key for debit */
  debitAccountKey: StandardMappingKey | string;
  /** Account mapping key for credit */
  creditAccountKey: StandardMappingKey | string;
  /** Whether this posting applies VAT */
  applyVat: boolean;
  /** VAT account mapping key */
  vatAccountKey?: string;
  /** Description template (use {amount}, {reference}, {party} placeholders) */
  descriptionTemplate: string;
}

/** Report column definition for industry-specific reports */
export interface ReportColumnConfig {
  header: string;
  key: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'status';
  align?: 'left' | 'center' | 'right';
}

/** Industry-specific report configuration */
export interface IndustryReportConfig {
  id: string;
  title: string;
  subtitle?: string;
  /** Data source table */
  table: string;
  /** Column definitions */
  columns: ReportColumnConfig[];
  /** Default filters */
  defaultFilters?: Record<string, any>;
  /** Status options for filtering */
  statusOptions?: { value: string; label: string }[];
}

/** Purchase item type descriptor */
export interface PurchaseItemType {
  id: string;
  label: string;
  /** Which DB table stores these items */
  table: string;
  /** Fields specific to this item type */
  fields: { key: string; label: string; type: 'text' | 'number' | 'select'; required?: boolean; options?: { value: string; label: string }[] }[];
}

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

  // === Extended Plugin Interface ===

  /** Posting rules for sales/purchase invoices */
  postingRules?: {
    sale?: PostingRuleConfig;
    purchase?: PostingRuleConfig;
    return?: PostingRuleConfig;
  };
  /** Purchase item types (e.g., cars, inventory items, units) */
  purchaseItemTypes?: PurchaseItemType[];
  /** Industry-specific reports */
  reports?: IndustryReportConfig[];
  /** Custom dashboard card definitions */
  dashboardCards?: { id: string; title: string; icon: string; valueKey: string; format?: 'number' | 'currency' }[];
  /** Labels overrides for shared components */
  /** Labels overrides for shared components */
  labelOverrides?: Record<string, string>;
  /** Configurable tax rules (replaces hardcoded VAT logic) */
  taxRules?: import('@/core/engine/taxRules').TaxRulesConfig;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: MenuItem[];
}
