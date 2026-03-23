/**
 * Core Accounting Engine - Account Resolver (v2)
 * 
 * Uses repository interfaces instead of direct Supabase access.
 * Resolution priority:
 *   1. Explicit account ID from company settings
 *   2. Account mappings table
 *   3. Standard code fallbacks
 */

import { AccountMapping, StandardMappingKey } from './types';
import { IAccountRepository, IAccountMappingRepository } from './repositories';

/** Standard fallback codes for each mapping key */
const STANDARD_FALLBACKS: Record<StandardMappingKey, string[]> = {
  cash: ['1101'],
  sales_cash: ['1101', '1201'],
  sales_revenue: ['4101', '41011'],
  purchase_expense: ['1301', '5101'],
  suppliers: ['2101'],
  customers: ['1201'],
  vat_input: ['1108', '1181', '210402', '21042'],
  vat_output: ['210401', '21041', '2104'],
  retained_earnings: ['3103', '3102'],
  cost_of_sales: ['5101', '51011'],
};

export interface AccountRef {
  id: string;
  code: string;
  name: string;
}

export class AccountResolver {
  private accounts: AccountRef[] = [];
  private mappings: AccountMapping[] = [];
  private settingsOverrides: Record<string, string | null> = {};
  private loaded = false;

  constructor(
    private companyId: string,
    private accountRepo?: IAccountRepository,
    private mappingRepo?: IAccountMappingRepository,
  ) {}

  /** Load all account data for this company (call once, reuse) */
  async load(): Promise<void> {
    if (this.loaded) return;

    // Use injected repos or default Supabase repos
    let accountRepo = this.accountRepo;
    let mappingRepo = this.mappingRepo;

    if (!accountRepo || !mappingRepo) {
      const { defaultRepos } = await import('./supabaseRepositories');
      accountRepo = accountRepo || defaultRepos.accounts;
      mappingRepo = mappingRepo || defaultRepos.accountMappings;
    }

    const [accounts, mappings] = await Promise.all([
      accountRepo.findAll(this.companyId),
      mappingRepo.findActive(this.companyId),
    ]);
    this.accounts = accounts.map(a => ({ id: a.id, code: a.code, name: a.name }));
    this.mappings = mappings;

    // Load settings overrides via company settings repo
    const { defaultRepos } = await import('./supabaseRepositories');
    const settings = await defaultRepos.companySettings.getAccountingSettings(this.companyId);
    // Settings overrides are loaded via the CompanyConfig path, not duplicated here

    this.loaded = true;
  }

  /** Inject settings overrides (from CompanyConfig.accountMappings) */
  setSettingsOverrides(overrides: Map<string, string>): void {
    for (const [key, val] of overrides) {
      this.settingsOverrides[key] = val;
    }
  }

  /** Resolve an account by mapping key */
  resolve(key: StandardMappingKey): AccountRef | null {
    const settingsId = this.settingsOverrides[key];
    if (settingsId) {
      const acc = this.accounts.find(a => a.id === settingsId);
      if (acc) return acc;
    }
    const mapping = this.mappings.find(m => m.mapping_key === key);
    if (mapping) {
      const acc = this.accounts.find(a => a.id === mapping.account_id);
      if (acc) return acc;
    }
    const fallbacks = STANDARD_FALLBACKS[key] || [];
    for (const code of fallbacks) {
      const acc = this.accounts.find(a => a.code === code);
      if (acc) return acc;
    }
    return null;
  }

  /** Resolve by explicit ID → mapping key → fallback codes */
  resolveFlexible(
    explicitId: string | null,
    mappingKey: StandardMappingKey | null,
    ...fallbackCodes: string[]
  ): AccountRef | null {
    if (explicitId) {
      const acc = this.accounts.find(a => a.id === explicitId);
      if (acc) return acc;
    }
    if (mappingKey) {
      const resolved = this.resolve(mappingKey);
      if (resolved) return resolved;
    }
    for (const code of fallbackCodes) {
      const acc = this.accounts.find(a => a.code === code);
      if (acc) return acc;
    }
    return null;
  }

  /** Find account by name under a parent code prefix */
  findByNameUnderCode(name: string, parentCodePrefix: string): AccountRef | null {
    return this.accounts.find(a => a.code?.startsWith(parentCodePrefix) && a.name === name) || null;
  }

  /** Get all loaded accounts */
  getAllAccounts(): AccountRef[] {
    return this.accounts;
  }
}
