import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export interface ReadinessStatus {
  hasAccounts: boolean;
  hasFiscalYear: boolean;
  hasTaxSettings: boolean;
  hasAccountingSettings: boolean;
  hasAccountMappings: boolean;
  mappingCount: number;
  isReady: boolean;
  missingSteps: string[];
}

const REQUIRED_MAPPINGS = ['cash', 'sales_cash', 'purchase_expense', 'suppliers', 'sales_revenue'];

async function checkReadiness(companyId: string): Promise<ReadinessStatus> {
  const [accountsRes, fiscalRes, taxRes, settingsRes, mappingsRes] = await Promise.all([
    supabase
      .from('account_categories')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('fiscal_years')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('tax_settings')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('company_accounting_settings')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('account_mappings')
      .select('mapping_key')
      .eq('company_id', companyId)
      .eq('is_active', true),
  ]);

  const hasAccounts = (accountsRes.count || 0) > 0;
  const hasFiscalYear = (fiscalRes.count || 0) > 0;
  const hasTaxSettings = (taxRes.count || 0) > 0;
  const hasAccountingSettings = (settingsRes.count || 0) > 0;
  const mappingKeys = (mappingsRes.data || []).map(m => m.mapping_key);
  const mappingCount = mappingKeys.length;
  const hasAccountMappings = REQUIRED_MAPPINGS.every(k => mappingKeys.includes(k));

  const missingSteps: string[] = [];
  if (!hasAccounts) missingSteps.push('accounts');
  if (!hasFiscalYear) missingSteps.push('fiscal_year');
  if (!hasTaxSettings) missingSteps.push('tax_settings');
  if (!hasAccountMappings && hasAccounts) missingSteps.push('account_mappings');

  return {
    hasAccounts,
    hasFiscalYear,
    hasTaxSettings,
    hasAccountingSettings,
    hasAccountMappings,
    mappingCount,
    isReady: hasAccounts && hasFiscalYear && hasTaxSettings && hasAccountMappings,
    missingSteps,
  };
}

export function useCompanyReadiness() {
  const { companyId } = useCompany();

  return useQuery<ReadinessStatus>({
    queryKey: ['company-readiness', companyId],
    queryFn: () => checkReadiness(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // cache 10 minutes
  });
}
