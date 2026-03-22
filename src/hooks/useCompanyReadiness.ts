import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export interface ReadinessStatus {
  hasAccounts: boolean;
  hasFiscalYear: boolean;
  hasTaxSettings: boolean;
  hasAccountingSettings: boolean;
  isReady: boolean;
  missingSteps: string[];
}

async function checkReadiness(companyId: string): Promise<ReadinessStatus> {
  const [accountsRes, fiscalRes, taxRes, settingsRes] = await Promise.all([
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
  ]);

  const hasAccounts = (accountsRes.count || 0) > 0;
  const hasFiscalYear = (fiscalRes.count || 0) > 0;
  const hasTaxSettings = (taxRes.count || 0) > 0;
  const hasAccountingSettings = (settingsRes.count || 0) > 0;

  const missingSteps: string[] = [];
  if (!hasAccounts) missingSteps.push('accounts');
  if (!hasFiscalYear) missingSteps.push('fiscal_year');
  if (!hasTaxSettings) missingSteps.push('tax_settings');

  return {
    hasAccounts,
    hasFiscalYear,
    hasTaxSettings,
    hasAccountingSettings,
    isReady: hasAccounts && hasFiscalYear && hasTaxSettings,
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
