import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { fetchCostCenters, addCostCenter, updateCostCenter, deleteCostCenter, CostCenter } from '@/services/costCenters';

export function useCostCenters() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['cost-centers', companyId],
    queryFn: () => companyId ? fetchCostCenters(companyId) : [],
    enabled: !!companyId,
  });
}

export function useAddCostCenter() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (center: { code: string; name: string; description?: string; parent_id?: string }) => {
      if (!companyId) throw new Error('Company ID required');
      return addCostCenter(companyId, center);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', companyId] });
    },
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CostCenter> }) => updateCostCenter(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', companyId] });
    },
  });
}

export function useDeleteCostCenter() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (id: string) => deleteCostCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', companyId] });
    },
  });
}
