/**
 * Core Engine - Service Container
 * 
 * Factory that wires repositories to engine instances with proper DI.
 * Components use this instead of manually constructing engines.
 * 
 * Usage:
 *   const container = createServiceContainer(companyId);
 *   const entry = await container.journal.createEntry({...});
 *   const account = container.resolver.resolve('cash');
 */

import { AccountResolver } from './accountResolver';
import { JournalEngine } from './journalEngine';
import { InvoicePostingEngine } from './invoicePostingEngine';
import { defaultRepos } from './supabaseRepositories';
import {
  IAccountRepository,
  IJournalEntryRepository,
  IAccountMappingRepository,
  IFiscalYearRepository,
  IInvoiceRepository,
  ISupplierRepository,
  ICompanySettingsRepository,
} from './repositories';

export interface ServiceContainer {
  readonly companyId: string;
  readonly resolver: AccountResolver;
  readonly journal: JournalEngine;
  readonly invoicePosting: InvoicePostingEngine;
  /** Initialize resolver (load accounts + mappings) */
  initialize(): Promise<void>;
}

export interface ServiceContainerDeps {
  accounts?: IAccountRepository;
  journalEntries?: IJournalEntryRepository;
  accountMappings?: IAccountMappingRepository;
  fiscalYears?: IFiscalYearRepository;
  invoices?: IInvoiceRepository;
  suppliers?: ISupplierRepository;
  companySettings?: ICompanySettingsRepository;
}

/**
 * Create a fully-wired service container for a company.
 * 
 * Pass custom repos for testing; defaults to Supabase implementations.
 */
/**
 * Create a fully-wired service container for a company.
 * 
 * Pass custom repos for testing; defaults to Supabase implementations.
 */
export function createServiceContainer(
  companyId: string,
  deps?: ServiceContainerDeps,
): ServiceContainer {
  const repos = {
    accounts: deps?.accounts || defaultRepos.accounts,
    journalEntries: deps?.journalEntries || defaultRepos.journalEntries,
    accountMappings: deps?.accountMappings || defaultRepos.accountMappings,
    fiscalYears: deps?.fiscalYears || defaultRepos.fiscalYears,
    invoices: deps?.invoices || defaultRepos.invoices,
    suppliers: deps?.suppliers || defaultRepos.suppliers,
    companySettings: deps?.companySettings || defaultRepos.companySettings,
  };

  const resolver = new AccountResolver(companyId, repos.accounts, repos.accountMappings);
  const journal = new JournalEngine(companyId, repos.journalEntries);
  const invoicePosting = new InvoicePostingEngine(companyId, {
    resolver,
    journal,
    invoiceRepo: repos.invoices,
    supplierRepo: repos.suppliers,
    fiscalYearRepo: repos.fiscalYears,
    settingsRepo: repos.companySettings,
  });

  return {
    companyId,
    resolver,
    journal,
    invoicePosting,
    async initialize() {
      await resolver.load();
    },
  };
}

// ── LRU-cached containers (scales to 1000+ companies) ──
import { LRUCache } from './lruCache';

/** Max 200 containers cached, TTL 30 minutes */
const containerCache = new LRUCache<ServiceContainer>(200, 30);

/**
 * Get or create a ServiceContainer for a company (non-React).
 * Uses LRU eviction to prevent unbounded memory growth.
 * 
 * Usage:
 *   const { journal, resolver } = getServiceContainer(companyId);
 *   await journal.createEntry({...});
 */
export function getServiceContainer(companyId: string): ServiceContainer {
  let container = containerCache.get(companyId);
  if (!container) {
    container = createServiceContainer(companyId);
    containerCache.set(companyId, container);
  }
  return container;
}

/**
 * Get container with resolver pre-loaded (for services needing account resolution).
 */
export async function getInitializedContainer(companyId: string): Promise<ServiceContainer> {
  const container = getServiceContainer(companyId);
  await container.initialize();
  return container;
}

/** Clear cached container (e.g. on logout or company switch) */
export function clearContainerCache(companyId?: string): void {
  if (companyId) {
    containerCache.delete(companyId);
  } else {
    containerCache.clear();
  }
}

/** Get cache stats for monitoring */
export function getContainerCacheStats() {
  return {
    size: containerCache.size,
    maxSize: 200,
    pruned: containerCache.prune(),
  };
}
