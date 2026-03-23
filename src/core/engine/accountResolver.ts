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
  vat_input: ['1108', '1181', '1183', '210402', '21042'],
  vat_output: ['210401', '21041', '2103'],
  retained_earnings: ['3103', '3102'],
  cost_of_sales: ['5101', '51011'],
};

const VAT_NAME_REGEX = /(ضريب|vat)/i;

export interface AccountRef {
  id: string;
  code: string;
  name: string;
  type?: string;
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

    this.accounts = accounts.map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: (a as any).type,
    }));
    this.mappings = mappings;
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
    const direction = key === 'vat_input' ? 'input' : key === 'vat_output' ? 'output' : null;

    const settingsId = this.settingsOverrides[key];
    if (settingsId) {
      const acc = this.accounts.find(a => a.id === settingsId);
      if (acc && (!direction || this.isValidVatAccount(acc, direction))) return acc;
    }

    const mapping = this.mappings.find(m => m.mapping_key === key);
    if (mapping) {
      const acc = this.accounts.find(a => a.id === mapping.account_id);
      if (acc && (!direction || this.isValidVatAccount(acc, direction))) return acc;
    }

    const fallbacks = STANDARD_FALLBACKS[key] || [];
    for (const code of fallbacks) {
      const acc = this.accounts.find(a => a.code === code);
      if (acc && (!direction || this.isValidVatAccount(acc, direction))) return acc;
    }

    if (direction) {
      return this.findSemanticVatAccount(direction);
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

  private isValidVatAccount(account: AccountRef, direction: 'input' | 'output'): boolean {
    const code = account.code || '';
    const name = (account.name || '').toLowerCase();
    const type = (account.type || '').toLowerCase();
    const hasVatName = VAT_NAME_REGEX.test(name);

    if (direction === 'output') {
      if (/^(210401|21041|2103)/.test(code)) return true;
      if (!hasVatName) return false;
      return /(مخرج|مبيعات)/.test(name) || /(liab|خصوم|دائن)/.test(type);
    }

    if (/^(1108|118|210402|21042)/.test(code)) return true;
    if (!hasVatName) return false;
    if (/(مدخل|مشتريات|مسترد)/.test(name)) return true;
    if (/(asset|أصول|مدين)/.test(type)) return true;

    // Shared VAT account fallback when separate input VAT account does not exist
    return /^2103/.test(code);
  }

  private findSemanticVatAccount(direction: 'input' | 'output'): AccountRef | null {
    const vatAccounts = this.accounts.filter(acc => {
      const code = acc.code || '';
      return VAT_NAME_REGEX.test(acc.name || '') || /^2103/.test(code);
    });

    for (const acc of vatAccounts) {
      if (this.isValidVatAccount(acc, direction)) return acc;
    }

    return null;
  }
}
