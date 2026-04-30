import { useQuery } from '@tanstack/react-query';
import { fetchZatcaConfig } from '@/services/zatcaIntegration';
import { useCompanyId } from './useCompanyId';

/**
 * Lightweight status for the current company's ZATCA onboarding,
 * used in invoice preview to surface signature/CSID details.
 */
export function useZatcaConfigStatus() {
  const companyId = useCompanyId();

  const { data } = useQuery({
    queryKey: ['zatca-config-status', companyId],
    queryFn: () => (companyId ? fetchZatcaConfig(companyId) : Promise.resolve(null)),
    enabled: Boolean(companyId),
    staleTime: 60_000,
  });

  return {
    hasComplianceCsid: Boolean(data?.compliance_csid),
    hasProductionCsid: Boolean(data?.production_csid),
    onboardingStatus: data?.onboarding_status ?? null,
    environment: data?.environment ?? null,
  };
}
