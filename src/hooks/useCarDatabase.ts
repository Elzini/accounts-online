/**
 * Car Dealership-specific database hooks.
 * These hooks are ONLY for companies with company_type === 'car_dealership'.
 * General companies should use useDatabase.ts hooks instead.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as carDb from '@/services/carDealership';
import type { Database } from '@/integrations/supabase/types';
import type { MultiCarSaleData } from '@/services/carDealership';
import { useCompany } from '@/contexts/CompanyContext';

type CarInsert = Database['public']['Tables']['cars']['Insert'];
type CarUpdate = Database['public']['Tables']['cars']['Update'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];
type SaleUpdate = Database['public']['Tables']['sales']['Update'];
type PurchaseBatchInsert = Database['public']['Tables']['purchase_batches']['Insert'];

export { MultiCarSaleData };

// Cars hooks
export function useCars() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['cars', companyId],
    queryFn: carDb.fetchCars,
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddCar() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (car: CarInsert) => carDb.addCar(car),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
    },
  });
}

export function useUpdateCar() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ id, car }: { id: string; car: CarUpdate }) => carDb.updateCar(id, car),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
    },
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (id: string) => carDb.deleteCar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
    },
  });
}

// Sales hooks (car dealership specific)
export function useSales() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['sales', companyId],
    queryFn: carDb.fetchSales,
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (sale: SaleInsert) => carDb.addSale(sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ id, sale }: { id: string; sale: SaleUpdate }) => carDb.updateSale(id, sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
    },
  });
}

export function useUpdateSaleWithItems() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ saleId, saleData, items }: {
      saleId: string;
      saleData: {
        sale_price: number;
        seller_name?: string | null;
        commission?: number;
        other_expenses?: number;
        sale_date: string;
        profit: number;
        payment_account_id?: string | null;
      };
      items: Array<{ car_id: string; sale_price: number; purchase_price: number }>;
    }) => carDb.updateSaleWithItems(saleId, saleData, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ saleId, carId }: { saleId: string; carId: string }) => carDb.deleteSale(saleId, carId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
    },
  });
}

export function useReverseSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (saleId: string) => carDb.reverseSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
    },
  });
}

export function useSalesWithItems() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['sales-with-items', companyId],
    queryFn: carDb.fetchSalesWithItems,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddMultiCarSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (saleData: MultiCarSaleData) => carDb.addMultiCarSale(saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
    },
  });
}

export function useDeleteMultiCarSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (saleId: string) => carDb.deleteMultiCarSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
    },
  });
}

export function useApproveSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (saleId: string) => carDb.approveSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
    },
  });
}

// Purchase Batches hooks (car dealership specific)
export function usePurchaseBatches() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['purchase-batches', companyId],
    queryFn: carDb.fetchPurchaseBatches,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddPurchaseBatch() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ batch, cars }: {
      batch: PurchaseBatchInsert & { payment_account_id?: string };
      cars: Array<Omit<CarInsert, 'batch_id'>>;
    }) => carDb.addPurchaseBatch(batch, cars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-batches', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
    },
  });
}
