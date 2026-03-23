/**
 * Core Accounting Engine - Public API
 * 
 * This is the single entry point for all accounting operations.
 * Industry modules extend this core without modifying it.
 */

export * from './types';
export { validateJournalEntry, validateDateInFiscalYear, validateLeafAccount } from './validation';
export { AccountResolver } from './accountResolver';
export { JournalEngine } from './journalEngine';
export { InvoicePostingEngine } from './invoicePostingEngine';
export { getCoreDashboardStats } from './dashboardEngine';
export { ModuleRegistry } from './moduleRegistry';
