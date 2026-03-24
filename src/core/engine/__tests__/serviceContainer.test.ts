import { describe, it, expect, beforeEach } from 'vitest';
import { createServiceContainer, clearContainerCache, getServiceContainer, getContainerCacheStats } from '@/core/engine/serviceContainer';
import { LRUCache } from '@/core/engine/lruCache';
import type { IAccountRepository, IAccountMappingRepository, IJournalEntryRepository, IFiscalYearRepository, IInvoiceRepository, ISupplierRepository, ICompanySettingsRepository } from '@/core/engine/repositories';
import type { Account, JournalEntryRecord } from '@/core/engine/types';

const mockAccounts: Account[] = [
  { id: 'a1', company_id: 'c1', code: '1101', name: 'Cash', type: 'assets', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
];

const mockDeps = {
  accounts: {
    findAll: async () => mockAccounts,
    findById: async () => null,
    findByCode: async () => null,
    findByNameUnderCode: async () => null,
  } as IAccountRepository,
  accountMappings: {
    findActive: async () => [{ mapping_key: 'cash', account_id: 'a1' }],
  } as IAccountMappingRepository,
  journalEntries: {
    create: async (d: any) => ({ id: 'je-1', ...d, entry_number: 1, created_at: '', updated_at: '' } as JournalEntryRecord),
    createLines: async () => {},
    findByReference: async () => null,
    deleteLines: async () => {},
    updateTotals: async () => {},
    deleteEntry: async () => {},
    deleteByReference: async () => {},
    updateEntry: async () => {},
    fetchAllLines: async () => [],
    findOpeningEntryIds: async () => [],
  } as IJournalEntryRepository,
  fiscalYears: { findCurrent: async () => null, findById: async () => null, create: async () => ({} as any), update: async () => {} } as IFiscalYearRepository,
  invoices: { findById: async () => null, updateStatus: async () => {} } as IInvoiceRepository,
  suppliers: { findNameById: async () => null } as ISupplierRepository,
  companySettings: { getAccountingSettings: async () => null } as ICompanySettingsRepository,
};

describe('ServiceContainer', () => {
  beforeEach(() => clearContainerCache());

  it('creates container with correct companyId', () => {
    const container = createServiceContainer('c1', mockDeps);
    expect(container.companyId).toBe('c1');
  });

  it('exposes resolver, journal, and invoicePosting', () => {
    const container = createServiceContainer('c1', mockDeps);
    expect(container.resolver).toBeDefined();
    expect(container.journal).toBeDefined();
    expect(container.invoicePosting).toBeDefined();
  });

  it('initialize loads accounts into resolver', async () => {
    const container = createServiceContainer('c1', mockDeps);
    await container.initialize();
    const cash = container.resolver.resolve('cash');
    expect(cash).not.toBeNull();
    expect(cash!.code).toBe('1101');
  });

  it('getServiceContainer caches by companyId', () => {
    clearContainerCache();
    const c1 = getServiceContainer('test-cache-1');
    const c2 = getServiceContainer('test-cache-1');
    expect(c1).toBe(c2);
  });

  it('clearContainerCache removes specific company', () => {
    clearContainerCache();
    const c1 = getServiceContainer('test-clear');
    clearContainerCache('test-clear');
    const c2 = getServiceContainer('test-clear');
    expect(c1).not.toBe(c2);
  });

  it('getContainerCacheStats returns stats', () => {
    clearContainerCache();
    getServiceContainer('s1');
    getServiceContainer('s2');
    const stats = getContainerCacheStats();
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(200);
  });
});

describe('LRUCache', () => {
  it('evicts oldest when at capacity', () => {
    const cache = new LRUCache<string>(3, 60);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    cache.set('d', '4'); // should evict 'a'
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('d')).toBe('4');
    expect(cache.size).toBe(3);
  });

  it('refreshes access on get', () => {
    const cache = new LRUCache<string>(3, 60);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    cache.get('a'); // refresh 'a'
    cache.set('d', '4'); // should evict 'b' (oldest untouched)
    expect(cache.get('a')).toBe('1');
    expect(cache.get('b')).toBeUndefined();
  });

  it('prune removes expired entries', () => {
    const cache = new LRUCache<string>(10, 0); // 0 min TTL = instant expire
    cache.set('x', 'val');
    const pruned = cache.prune();
    expect(pruned).toBe(1);
    expect(cache.size).toBe(0);
  });
});
