import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/services/database';
import type { Database } from '@/integrations/supabase/types';
import type { MultiCarSaleData } from '@/services/database';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];
type CarInsert = Database['public']['Tables']['cars']['Insert'];
type CarUpdate = Database['public']['Tables']['cars']['Update'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];
type SaleUpdate = Database['public']['Tables']['sales']['Update'];
type PurchaseBatchInsert = Database['public']['Tables']['purchase_batches']['Insert'];

// Customers hooks
export function useCustomers() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['customers', companyId],
    queryFn: db.fetchCustomers,
    enabled: !!companyId,
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

// Cars hooks
export function useCars() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['cars', companyId],
    queryFn: db.fetchCars,
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}

export function useAddCar() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (car: CarInsert) => db.addCar(car),
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
    mutationFn: ({ id, car }: { id: string; car: CarUpdate }) => 
      db.updateCar(id, car),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      // Invalidate sales to reflect updated profit calculations
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
    mutationFn: (id: string) => db.deleteCar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
    },
  });
}

// Sales hooks
export function useSales() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['sales', companyId],
    queryFn: db.fetchSales,
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}

export function useAddSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (sale: SaleInsert) => db.addSale(sale),
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
    mutationFn: ({ id, sale }: { id: string; sale: SaleUpdate }) => 
      db.updateSale(id, sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
    },
  });
}

export function useUpdateSaleWithItems() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ 
      saleId, 
      saleData, 
      items 
    }: { 
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
      items: Array<{
        car_id: string;
        sale_price: number;
        purchase_price: number;
      }>;
    }) => db.updateSaleWithItems(saleId, saleData, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ saleId, carId }: { saleId: string; carId: string }) => 
      db.deleteSale(saleId, carId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
    },
  });
}

// Reverse Sale (Return Invoice - إرجاع الفاتورة)
export function useReverseSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (saleId: string) => db.reverseSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
    },
  });
}

// Stats hook
export function useStats() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  
  return useQuery({
    queryKey: ['stats', companyId, selectedFiscalYear?.id],
    queryFn: () => db.fetchStats(selectedFiscalYear?.id),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

// All-time stats hook (across all fiscal years)
export function useAllTimeStats() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['all-time-stats', companyId],
    queryFn: () => db.fetchAllTimeStats(),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Monthly chart data hook
export function useMonthlyChartData() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  
  return useQuery({
    queryKey: ['monthly-chart-data', companyId, selectedFiscalYear?.id],
    queryFn: () => db.fetchMonthlyChartData(selectedFiscalYear?.id),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Purchase Batches hooks
export function usePurchaseBatches() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['purchase-batches', companyId],
    queryFn: db.fetchPurchaseBatches,
    enabled: !!companyId,
  });
}

export function useAddPurchaseBatch() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ batch, cars }: { 
      batch: PurchaseBatchInsert & { payment_account_id?: string }; 
      cars: Array<Omit<CarInsert, 'batch_id'>> 
    }) => 
      db.addPurchaseBatch(batch, cars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-batches', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
    },
  });
}

// Multi-car Sales hooks
export function useSalesWithItems() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['sales-with-items', companyId],
    queryFn: db.fetchSalesWithItems,
    enabled: !!companyId,
  });
}

export function useAddMultiCarSale() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (saleData: MultiCarSaleData) => db.addMultiCarSale(saleData),
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
    mutationFn: (saleId: string) => db.deleteMultiCarSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sales-with-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
    },
  });
}
