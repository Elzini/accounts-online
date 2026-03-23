/**
 * Core Accounting Engine - Public API
 * 
 * This is the single entry point for all accounting operations.
 * Industry modules extend this core without modifying it.
 */

// Types
export * from './types';

// Repository Interfaces (Ports)
export type {
  IAccountRepository,
  IJournalEntryRepository,
  IAccountMappingRepository,
  ICompanyConfigRepository,
  IFiscalYearRepository,
  IInvoiceRepository,
  ISupplierRepository,
} from './repositories';

// Validation
export { validateJournalEntry, validateDateInFiscalYear, validateLeafAccount } from './validation';

// Core Engines
export { AccountResolver } from './accountResolver';
export { JournalEngine } from './journalEngine';
export { InvoicePostingEngine } from './invoicePostingEngine';
export { getCoreDashboardStats } from './dashboardEngine';
export { ModuleRegistry } from './moduleRegistry';

// Dynamic Configuration
export { loadCompanyConfig, loadCurrentFiscalYear } from './companyConfigLoader';
export { computeTrialBalance, getAccountStatement } from './ledgerEngine';
export type { AccountBalance, TrialBalanceParams } from './ledgerEngine';
export { generateOpeningBalances } from './fiscalYearEngine';

// Industry Features
export { getIndustryFeatures } from './industryFeatures';
export type { IndustryFeatures } from './industryFeatures';

// Event Bus
export { EventBus, Events } from './eventBus';
export type { AccountingEvent, JournalCreatedEvent, InvoicePostedEvent, FiscalYearClosedEvent } from './eventBus';

// Posting Middleware
export { PostingMiddleware } from './postingMiddleware';
export type { PrePostHook, PostHook, PostingContext } from './postingMiddleware';

// Supabase Repositories (default implementations)
export { defaultRepos } from './supabaseRepositories';
