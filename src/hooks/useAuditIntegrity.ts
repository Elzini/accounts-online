import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { verifyAuditLogIntegrity } from '@/services/encryption';

/**
 * Hook to verify audit log integrity for the current company
 * Returns the integrity status of the immutable audit chain
 */
export function useAuditIntegrity() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['audit-integrity', companyId],
    queryFn: async () => {
      if (!companyId) {
        return {
          isValid: false,
          message: 'No company ID available',
        };
      }

      return verifyAuditLogIntegrity(companyId);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}
