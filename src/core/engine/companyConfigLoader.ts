/**
 * Core Engine - Company Configuration Loader
 * Loads all company settings into a unified CompanyConfig object.
 * Uses repository interfaces — NO direct Supabase imports.
 */

import { CompanyConfig, FiscalYear } from './types';
import { ICompanyConfigRepository, IFiscalYearRepository } from './repositories';

/** Lazy-load default repos when none are injected */
async function getDefaultRepos() {
  const { defaultRepos } = await import('./supabaseRepositories');
  return defaultRepos;
}

/**
 * Load complete company configuration from database.
 * Merges: companies + company_accounting_settings + tax_settings + account_mappings
 */
export async function loadCompanyConfig(
  companyId: string,
  deps?: { configRepo?: ICompanyConfigRepository },
): Promise<CompanyConfig> {
  if (deps?.configRepo) {
    return deps.configRepo.load(companyId);
  }
  // Use default Supabase repository (single source of truth)
  const { defaultRepos } = await import('./supabaseRepositories');
  return defaultRepos.companyConfig.load(companyId);
}

/**
 * Load current fiscal year for a company
 */
export async function loadCurrentFiscalYear(
  companyId: string,
  deps?: { fiscalYearRepo?: IFiscalYearRepository },
): Promise<FiscalYear | null> {
  if (deps?.fiscalYearRepo) {
    return deps.fiscalYearRepo.findCurrent(companyId);
  }
  const { defaultRepos } = await import('./supabaseRepositories');
  return defaultRepos.fiscalYears.findCurrent(companyId);
}
