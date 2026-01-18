import { useCompany } from '@/contexts/CompanyContext';

/**
 * Hook to get the current company ID for use in database operations.
 * All insert operations should include this company_id.
 */
export function useCompanyId(): string | null {
  const { companyId } = useCompany();
  return companyId;
}
