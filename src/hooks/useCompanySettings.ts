import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCompanySettings, 
  updateCompanySettings, 
  uploadCompanyLogo,
  CompanySettings 
} from '@/services/companySettings';

export function useCompanySettings(companyId: string | null) {
  return useQuery({
    queryKey: ['company-settings', companyId],
    queryFn: () => companyId ? fetchCompanySettings(companyId) : null,
    enabled: !!companyId,
  });
}

export function useUpdateCompanySettings(companyId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<CompanySettings>) => {
      if (!companyId) throw new Error('Company ID is required');
      return updateCompanySettings(companyId, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUploadCompanyLogo(companyId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => {
      if (!companyId) throw new Error('Company ID is required');
      return uploadCompanyLogo(file, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
