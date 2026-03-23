/**
 * Core Accounting Engine - Public API
 * Single entry point for all accounting operations.
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
  ICompanySettingsRepository,
} from './repositories';

// Validation
export { validateJournalEntry, validateDateInFiscalYear, validateLeafAccount } from './validation';

// Core Engines
export { AccountResolver } from './accountResolver';
export type { AccountRef } from './accountResolver';
export { JournalEngine } from './journalEngine';
export { InvoicePostingEngine } from './invoicePostingEngine';
// DashboardEngine removed — statsEngine.ts is the canonical dashboard stats service
export { ModuleRegistry } from './moduleRegistry';

// Dynamic Configuration
export { loadCompanyConfig, loadCurrentFiscalYear } from './companyConfigLoader';
export { computeTrialBalance, getAccountStatement } from './ledgerEngine';
export type { AccountBalance, TrialBalanceParams } from './ledgerEngine';
export { generateOpeningBalances } from './fiscalYearEngine';

// Industry Features
export { getIndustryFeatures, getCompanyTypeLabel, getIndustryDisplayMeta } from './industryFeatures';
export type { IndustryFeatures, IndustryDisplayMeta } from './industryFeatures';

// Event Bus
export { EventBus, Events } from './eventBus';
export type { AccountingEvent, JournalCreatedEvent, InvoicePostedEvent, FiscalYearClosedEvent } from './eventBus';

// Posting Middleware
export { PostingMiddleware } from './postingMiddleware';
export type { PrePostHook, PostHook, PostingContext } from './postingMiddleware';

// Service Container (DI)
export { createServiceContainer } from './serviceContainer';
export type { ServiceContainer, ServiceContainerDeps } from './serviceContainer';

// Supabase Repositories (default implementations)
export { defaultRepos } from './supabaseRepositories';
