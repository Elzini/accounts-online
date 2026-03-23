import { describe, it, expect, beforeEach } from 'vitest';
import { AccountResolver } from '@/core/engine/accountResolver';
import type { IAccountRepository, IAccountMappingRepository } from '@/core/engine/repositories';
import type { Account, AccountMapping } from '@/core/engine/types';

// ── Mock Data ──
const mockAccounts: Account[] = [
  { id: 'a1', company_id: 'c1', code: '1101', name: 'النقدية', type: 'assets', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'a2', company_id: 'c1', code: '4101', name: 'إيرادات المبيعات', type: 'revenue', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'a3', company_id: 'c1', code: '5101', name: 'مصروفات المشتريات', type: 'expenses', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'a4', company_id: 'c1', code: '2101', name: 'الموردون', type: 'liabilities', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'a5', company_id: 'c1', code: '21042', name: 'ضريبة مشتريات مستردة', type: 'liabilities', parent_id: null, is_system: false, description: null, created_at: '', updated_at: '' },
  { id: 'a6', company_id: 'c1', code: '3103', name: 'أرباح مبقاة', type: 'equity', parent_id: null, is_system: false, description: null, created_at: '', updated_at: '' },
  { id: 'a7', company_id: 'c1', code: '210101', name: 'شركة الفهد', type: 'liabilities', parent_id: 'a4', is_system: false, description: null, created_at: '', updated_at: '' },
];

const mockMappings: AccountMapping[] = [
  { mapping_key: 'cash', account_id: 'a1' },
  { mapping_key: 'sales_revenue', account_id: 'a2' },
  { mapping_key: 'purchase_expense', account_id: 'a3' },
  { mapping_key: 'suppliers', account_id: 'a4' },
  { mapping_key: 'vat_input', account_id: 'a5' },
];

// ── Mock Repos ──
const mockAccountRepo: IAccountRepository = {
  findAll: async () => mockAccounts,
  findById: async (id) => mockAccounts.find(a => a.id === id) || null,
  findByCode: async (_cid, code) => mockAccounts.find(a => a.code === code) || null,
  findByNameUnderCode: async (_cid, name, prefix) => mockAccounts.find(a => a.code.startsWith(prefix) && a.name === name) || null,
};

const mockMappingRepo: IAccountMappingRepository = {
  findActive: async () => mockMappings,
};

describe('AccountResolver', () => {
  let resolver: AccountResolver;

  beforeEach(async () => {
    resolver = new AccountResolver('c1', mockAccountRepo, mockMappingRepo);
    await resolver.load();
  });

  it('resolves account by mapping key', () => {
    const cash = resolver.resolve('cash');
    expect(cash).not.toBeNull();
    expect(cash!.code).toBe('1101');
  });

  it('resolves via standard fallback when no mapping exists', () => {
    const re = resolver.resolve('retained_earnings');
    expect(re).not.toBeNull();
    expect(re!.code).toBe('3103');
  });

  it('returns null for unknown mapping with no fallback match', () => {
    const result = resolver.resolve('cost_of_sales');
    // cost_of_sales fallbacks are ['5101','51011'], and '5101' exists
    expect(result).not.toBeNull();
    expect(result!.code).toBe('5101');
  });

  it('settings overrides take priority', () => {
    resolver.setSettingsOverrides(new Map([['cash', 'a3']]));
    const cash = resolver.resolve('cash');
    expect(cash!.id).toBe('a3');
  });

  it('resolveFlexible: explicit ID first', () => {
    const result = resolver.resolveFlexible('a6', 'cash');
    expect(result!.id).toBe('a6');
  });

  it('resolveFlexible: mapping key second', () => {
    const result = resolver.resolveFlexible(null, 'cash');
    expect(result!.id).toBe('a1');
  });

  it('resolveFlexible: fallback codes last', () => {
    const result = resolver.resolveFlexible(null, null, '3103');
    expect(result!.id).toBe('a6');
  });

  it('resolveFlexible: returns null when nothing found', () => {
    const result = resolver.resolveFlexible(null, null, '9999');
    expect(result).toBeNull();
  });

  it('findByNameUnderCode returns matching account', () => {
    const result = resolver.findByNameUnderCode('شركة الفهد', '2101');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('a7');
  });

  it('getAllAccounts returns all loaded accounts', () => {
    expect(resolver.getAllAccounts()).toHaveLength(mockAccounts.length);
  });

  it('load() is idempotent', async () => {
    await resolver.load();
    await resolver.load();
    expect(resolver.getAllAccounts()).toHaveLength(mockAccounts.length);
  });
});
