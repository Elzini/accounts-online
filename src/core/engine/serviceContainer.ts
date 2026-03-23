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
}

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
  };

  const resolver = new AccountResolver(companyId, repos.accounts, repos.accountMappings);
  const journal = new JournalEngine(companyId, repos.journalEntries);
  const invoicePosting = new InvoicePostingEngine(companyId, {
    resolver,
    journal,
    invoiceRepo: repos.invoices,
    supplierRepo: repos.suppliers,
    fiscalYearRepo: repos.fiscalYears,
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
