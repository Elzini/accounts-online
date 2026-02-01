import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/services/database';
import { useCompany } from '@/contexts/CompanyContext';

export function useRecalculateCompanyProfits() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: () => db.recalculateCompanySalesProfits(),
    onSuccess: () => {
      // Refresh all places where profit appears
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
    },
  });
}
