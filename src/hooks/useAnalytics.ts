import { useQuery } from '@tanstack/react-query';
import { fetchAdvancedAnalytics, AdvancedStats } from '@/services/analytics';
import { useCompany } from '@/contexts/CompanyContext';

export function useAdvancedAnalytics() {
  const { companyId } = useCompany();
  
  return useQuery<AdvancedStats>({
    queryKey: ['advanced-analytics', companyId],
    queryFn: fetchAdvancedAnalytics,
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });
}
