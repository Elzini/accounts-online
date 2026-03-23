/**
 * Core Engine - Company Configuration Loader
 * Loads all company settings into a unified CompanyConfig object
 * Single source of truth for company configuration
 */

import { supabase } from '@/integrations/supabase/client';
import { CompanyConfig, FiscalYear } from './types';

/**
 * Load complete company configuration from database
 * Merges: companies + company_accounting_settings + tax_settings + account_mappings
 */
export async function loadCompanyConfig(companyId: string): Promise<CompanyConfig> {
  const [companyRes, accountingRes, taxRes, mappingsRes] = await Promise.all([
    supabase.from('companies').select('id, name, company_type, is_active').eq('id', companyId).single(),
    supabase.from('company_accounting_settings').select('*').eq('company_id', companyId).maybeSingle(),
    supabase.from('tax_settings').select('*').eq('company_id', companyId).eq('is_active', true).maybeSingle(),
    supabase.from('account_mappings').select('mapping_key, account_id').eq('company_id', companyId).eq('is_active', true),
  ]);

  if (companyRes.error) throw companyRes.error;
  const company = companyRes.data;
  const acctSettings = accountingRes.data as any;
  const tax = taxRes.data as any;
  const mappings = mappingsRes.data || [];

  // Build account mappings map
  const accountMappings = new Map<string, string>();
  for (const m of mappings) {
    if (m.account_id) accountMappings.set(m.mapping_key, m.account_id);
  }

  // Also add settings-based mappings (higher priority)
  if (acctSettings) {
    const settingsMap: Record<string, string | null> = {
      cash: acctSettings.purchase_cash_account_id,
      sales_cash: acctSettings.sales_cash_account_id,
      sales_revenue: acctSettings.sales_revenue_account_id,
      purchase_expense: acctSettings.purchase_inventory_account_id,
      suppliers: acctSettings.suppliers_account_id,
      vat_input: acctSettings.vat_recoverable_account_id,
      vat_output: acctSettings.vat_payable_account_id,
      cost_of_sales: acctSettings.cogs_account_id,
    };
    for (const [key, val] of Object.entries(settingsMap)) {
      if (val) accountMappings.set(key, val);
    }
  }

  return {
    id: company.id,
    name: company.name,
    company_type: company.company_type || 'general_trading',
    is_active: company.is_active ?? true,
    accounting: {
      auto_journal_entries: acctSettings?.auto_journal_entries_enabled ?? true,
      auto_purchase_entries: acctSettings?.auto_purchase_entries ?? true,
      auto_sales_entries: acctSettings?.auto_sales_entries ?? true,
      valuation_method: 'average', // Default; extend later
    },
    tax: {
      tax_rate: tax?.tax_rate ?? 15,
      tax_name: tax?.tax_name ?? 'ضريبة القيمة المضافة',
      is_active: tax?.is_active ?? false,
      apply_to_sales: tax?.apply_to_sales ?? true,
      apply_to_purchases: tax?.apply_to_purchases ?? true,
      tax_number: tax?.tax_number ?? null,
    },
    accountMappings,
  };
}

/**
 * Load current fiscal year for a company
 */
export async function loadCurrentFiscalYear(companyId: string): Promise<FiscalYear | null> {
  const { data, error } = await supabase
    .from('fiscal_years')
    .select('id, company_id, name, start_date, end_date, is_current, status')
    .eq('company_id', companyId)
    .eq('is_current', true)
    .maybeSingle();
  
  if (error || !data) return null;
  return data as FiscalYear;
}
