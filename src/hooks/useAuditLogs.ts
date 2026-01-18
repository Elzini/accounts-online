import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs, AuditLog } from '@/services/auditLogs';
import { useCompany } from '@/contexts/CompanyContext';

export function useAuditLogs() {
  const { companyId, isSuperAdmin } = useCompany();

  return useQuery<AuditLog[]>({
    queryKey: ['audit-logs', companyId, isSuperAdmin],
    queryFn: () => fetchAuditLogs(isSuperAdmin ? null : companyId),
    enabled: !!companyId || isSuperAdmin,
  });
}
