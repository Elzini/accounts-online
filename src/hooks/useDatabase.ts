/**
 * General Database Hooks
 * Contains hooks for general operations that work for ALL company types.
 * Car-specific hooks are in useCarDatabase.ts and re-exported here for backward compatibility.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/services/database';
import type { Database } from '@/integrations/supabase/types';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

// Re-export car-specific hooks for backward compatibility
export {
  useCars, useAddCar, useUpdateCar, useDeleteCar,
  useSales, useAddSale, useUpdateSale, useUpdateSaleWithItems,
  useDeleteSale, useReverseSale,
  useSalesWithItems, useAddMultiCarSale, useDeleteMultiCarSale, useApproveSale,
  usePurchaseBatches, useAddPurchaseBatch,
} from '@/hooks/useCarDatabase';
export type { MultiCarSaleData } from '@/hooks/useCarDatabase';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

// ==========================================
// GENERAL HOOKS (work for ALL company types)
// ==========================================

// Customers hooks
export function useCustomers() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['customers', companyId],
    queryFn: db.fetchCustomers,
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (customer: CustomerInsert) => db.addCustomer(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ id, customer }: { id: string; customer: CustomerUpdate }) =>
      db.updateCustomer(id, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (id: string) => db.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
    },
  });
}

// Suppliers hooks
export function useSuppliers() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: db.fetchSuppliers,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddSupplier() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (supplier: SupplierInsert) => db.addSupplier(supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ id, supplier }: { id: string; supplier: SupplierUpdate }) =>
      db.updateSupplier(id, supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (id: string) => db.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
    },
  });
}

// Stats hook - uses new unified StatsEngine
export function useStats() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  return useQuery({
    queryKey: ['stats', companyId, selectedFiscalYear?.id],
    queryFn: async () => {
      const { fetchDashboardStats } = await import('@/services/statsEngine');
      const stats = await fetchDashboardStats(selectedFiscalYear?.id);
      // Backward compatibility: map to legacy shape
      return {
        ...stats,
        availableNewCars: Number(stats.industryMetrics.availableNewCars ?? 0),
        availableUsedCars: Number(stats.industryMetrics.availableUsedCars ?? 0),
        availableCars: Number(stats.industryMetrics.availableCars ?? stats.industryMetrics.activeProjects ?? 0),
        activeProjectNames: stats.industryMetrics.activeProjectNames ?? [],
        totalCarExpenses: Number(stats.industryMetrics.carExpenses ?? 0),
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
  });
}

// All-time stats hook (across all fiscal years)
export function useAllTimeStats() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['all-time-stats', companyId],
    queryFn: async () => {
      const { fetchAllTimeDashboardStats } = await import('@/services/statsEngine');
      const stats = await fetchAllTimeDashboardStats();
      return {
        ...stats,
        totalCarsCount: Number((stats as any).industryMetrics?.totalCarsCount ?? 0),
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}

// Monthly chart data hook - uses StatsEngine
export function useMonthlyChartData() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  return useQuery({
    queryKey: ['monthly-chart-data', companyId, selectedFiscalYear?.id],
    queryFn: async () => {
      const { fetchMonthlyChartData } = await import('@/services/statsEngine');
      return fetchMonthlyChartData(selectedFiscalYear?.id);
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}
