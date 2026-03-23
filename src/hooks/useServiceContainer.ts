/**
 * React Hook - Service Container
 * 
 * Provides a fully-wired, cached service container for the current company.
 * All engine operations go through this single entry point.
 * 
 * Usage:
 *   const { container, isReady } = useServiceContainer();
 *   if (isReady) {
 *     const cash = container.resolver.resolve('cash');
 *     await container.journal.createEntry({...});
 *   }
 */

import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { createServiceContainer, ServiceContainer } from '@/core/engine/serviceContainer';

export function useServiceContainer() {
  const { companyId } = useCompany();

  const { data: container, isLoading } = useQuery<ServiceContainer | null>({
    queryKey: ['service-container', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const c = createServiceContainer(companyId);
      await c.initialize();
      return c;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    container: container || null,
    isReady: !!container && !isLoading,
    isLoading,
  };
}
