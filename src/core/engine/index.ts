/**
 * Core Accounting Engine - Public API
 * 
 * This is the single entry point for all accounting operations.
 * Industry modules extend this core without modifying it.
 */

// Types
export * from './types';

// Validation
export { validateJournalEntry, validateDateInFiscalYear, validateLeafAccount } from './validation';

// Core Engines
export { AccountResolver } from './accountResolver';
export { JournalEngine } from './journalEngine';
export { InvoicePostingEngine } from './invoicePostingEngine';
export { getCoreDashboardStats } from './dashboardEngine';
export { ModuleRegistry } from './moduleRegistry';

// Phase 2: Dynamic Configuration
export { loadCompanyConfig, loadCurrentFiscalYear } from './companyConfigLoader';
export { computeTrialBalance, getAccountStatement } from './ledgerEngine';
export type { AccountBalance, TrialBalanceParams } from './ledgerEngine';
export { generateOpeningBalances } from './fiscalYearEngine';
export { getIndustryFeatures } from './industryFeatures';
export type { IndustryFeatures } from './industryFeatures';
