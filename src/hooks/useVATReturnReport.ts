import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { getVATReturnReport, VATReturnReport } from '@/services/vatReturn';

export function useVATReturnReport(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  
  return useQuery<VATReturnReport | null>({
    queryKey: ['vat-return-report', companyId, startDate, endDate],
    queryFn: () => {
      if (!companyId) return null;
      return getVATReturnReport(companyId, startDate, endDate);
    },
    enabled: !!companyId,
  });
}
