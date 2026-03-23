/**
 * Core Engine - Repository Interfaces (Ports)
 * 
 * These interfaces define the DATA ACCESS CONTRACT.
 * The engine depends on these abstractions, NOT on Supabase directly.
 * This enables: testing with mocks, swapping backends, edge-function reuse.
 */

import { Account, JournalEntryInput, JournalEntryRecord, FiscalYear, AccountMapping, CompanyConfig } from './types';

// ============ Account Repository ============
export interface IAccountRepository {
  findAll(companyId: string): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  findByCode(companyId: string, code: string): Promise<Account | null>;
  findByNameUnderCode(companyId: string, name: string, parentCodePrefix: string): Promise<Account | null>;
}

// ============ Journal Entry Repository ============
export interface IJournalEntryRepository {
  create(entry: {
    company_id: string;
    fiscal_year_id: string;
    entry_date: string;
    description: string;
    reference_type: string;
    reference_id: string | null;
    is_posted: boolean;
    total_debit: number;
    total_credit: number;
  }): Promise<JournalEntryRecord>;

  createLines(lines: Array<{
    journal_entry_id: string;
    account_id: string;
    description: string | null;
    debit: number;
    credit: number;
    cost_center_id?: string | null;
  }>): Promise<void>;

  findByReference(companyId: string, referenceId: string, referenceTypes: string[]): Promise<string | null>;
  
  deleteLines(entryId: string): Promise<void>;
  
  updateTotals(entryId: string, totalDebit: number, totalCredit: number): Promise<void>;
  
  deleteEntry(entryId: string): Promise<void>;

  /** Fetch all posted lines for a fiscal year (paginated internally) */
  fetchAllLines(companyId: string, fiscalYearId: string): Promise<Array<{
    journal_entry_id: string;
    account_id: string;
    debit: number;
    credit: number;
    entry_date: string;
    reference_type?: string;
  }>>;

  /** Fetch opening entry IDs */
  findOpeningEntryIds(companyId: string, fiscalYearId: string): Promise<string[]>;
}

// ============ Account Mapping Repository ============
export interface IAccountMappingRepository {
  findActive(companyId: string): Promise<AccountMapping[]>;
}

// ============ Company Config Repository ============
export interface ICompanyConfigRepository {
  load(companyId: string): Promise<CompanyConfig>;
}

// ============ Fiscal Year Repository ============
export interface IFiscalYearRepository {
  findCurrent(companyId: string): Promise<FiscalYear | null>;
  findById(id: string): Promise<FiscalYear | null>;
}

// ============ Invoice Repository (for posting engine) ============
export interface IInvoiceRepository {
  findById(invoiceId: string): Promise<{
    id: string;
    company_id: string;
    fiscal_year_id: string | null;
    invoice_type: string;
    invoice_number: string;
    invoice_date: string | null;
    customer_name: string | null;
    supplier_id: string | null;
    subtotal: number;
    vat_amount: number;
    total: number;
    payment_account_id: string | null;
  } | null>;

  updateStatus(invoiceId: string, status: string, journalEntryId?: string): Promise<void>;
}

// ============ Supplier Repository (minimal, for posting) ============
export interface ISupplierRepository {
  findNameById(supplierId: string): Promise<string | null>;
}
