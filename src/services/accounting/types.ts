export interface TaxSettings {
  id: string;
  company_id: string;
  tax_name: string;
  tax_rate: number;
  is_active: boolean;
  apply_to_sales: boolean;
  apply_to_purchases: boolean;
  tax_number: string | null;
  company_name_ar: string | null;
  national_address: string | null;
  commercial_register: string | null;
  city: string | null;
  postal_code: string | null;
  building_number: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountType = 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';
export type ReferenceType = 'sale' | 'purchase' | 'manual' | 'adjustment' | 'opening' | 'voucher' | 'project_cost' | 'advance_payment' | 'unit_sale_revenue' | 'unit_sale_cogs' | 'closing';

export interface AccountCategory {
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

export interface JournalEntry {
  id: string;
  company_id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  reference_type: ReferenceType | null;
  reference_id: string | null;
  total_debit: number;
  total_credit: number;
  is_posted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project_id?: string | null;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  description: string | null;
  debit: number;
  credit: number;
  created_at: string;
  account?: AccountCategory;
}

export interface VATSettlementReport {
  vatPayable: {
    account: AccountCategory | null;
    balance: number;
  };
  vatRecoverable: {
    account: AccountCategory | null;
    balance: number;
  };
  netVAT: number;
  status: 'payable' | 'receivable' | 'settled';
  transactions: Array<{
    date: string;
    description: string;
    type: 'sales' | 'purchases';
    taxAmount: number;
    entryNumber: number;
  }>;
}
