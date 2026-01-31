import { useQuery } from '@tanstack/react-query';
import { fetchAdvancedAnalytics, AdvancedStats } from '@/services/analytics';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export function useAdvancedAnalytics() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  
  return useQuery<AdvancedStats>({
    queryKey: ['advanced-analytics', companyId, selectedFiscalYear?.id],
    queryFn: () => fetchAdvancedAnalytics(selectedFiscalYear?.id),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });
}
