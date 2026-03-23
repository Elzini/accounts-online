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

    if (this.accountRepo && this.mappingRepo) {
      // Use injected repos
      const [accounts, mappings] = await Promise.all([
        this.accountRepo.findAll(this.companyId),
        this.mappingRepo.findActive(this.companyId),
      ]);
      this.accounts = accounts.map(a => ({ id: a.id, code: a.code, name: a.name }));
      this.mappings = mappings;
    } else {
      // Fallback: direct Supabase (backward compat)
      const { supabase } = await import('@/integrations/supabase/client');
      const [accountsRes, mappingsRes, settingsRes] = await Promise.all([
        supabase.from('account_categories').select('id, code, name').eq('company_id', this.companyId),
        supabase.from('account_mappings').select('mapping_key, account_id').eq('company_id', this.companyId).eq('is_active', true),
        supabase.from('company_accounting_settings').select('*').eq('company_id', this.companyId).maybeSingle(),
      ]);
      this.accounts = accountsRes.data || [];
      this.mappings = (mappingsRes.data || []).filter(m => m.account_id).map(m => ({
        mapping_key: m.mapping_key,
        account_id: m.account_id!,
      }));
      const settings = settingsRes.data;
      if (settings) {
        const s = settings as any;
        this.settingsOverrides = {
          cash: s.cash_account_id || null,
          sales_cash: s.sales_cash_account_id || null,
          sales_revenue: s.sales_revenue_account_id || null,
          purchase_expense: s.purchase_inventory_account_id || null,
          suppliers: s.suppliers_account_id || null,
          vat_input: s.vat_recoverable_account_id || null,
          vat_output: s.vat_payable_account_id || null,
        };
      }
    }

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
