import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/services/database';
import type { Database } from '@/integrations/supabase/types';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];
type CarInsert = Database['public']['Tables']['cars']['Insert'];
type CarUpdate = Database['public']['Tables']['cars']['Update'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];
type SaleUpdate = Database['public']['Tables']['sales']['Update'];

// Customers hooks
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: db.fetchCustomers,
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customer: CustomerInsert) => db.addCustomer(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, customer }: { id: string; customer: CustomerUpdate }) => 
      db.updateCustomer(id, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => db.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Suppliers hooks
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: db.fetchSuppliers,
  });
}

export function useAddSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (supplier: SupplierInsert) => db.addSupplier(supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, supplier }: { id: string; supplier: SupplierUpdate }) => 
      db.updateSupplier(id, supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => db.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Cars hooks
export function useCars() {
  return useQuery({
    queryKey: ['cars'],
    queryFn: db.fetchCars,
  });
}

export function useAddCar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (car: CarInsert) => db.addCar(car),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateCar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, car }: { id: string; car: CarUpdate }) => 
      db.updateCar(id, car),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => db.deleteCar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// Sales hooks
export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: db.fetchSales,
  });
}

export function useAddSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sale: SaleInsert) => db.addSale(sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, sale }: { id: string; sale: SaleUpdate }) => 
      db.updateSale(id, sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ saleId, carId }: { saleId: string; carId: string }) => 
      db.deleteSale(saleId, carId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// Stats hook
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: db.fetchStats,
  });
}

// Monthly chart data hook
export function useMonthlyChartData() {
  return useQuery({
    queryKey: ['monthly-chart-data'],
    queryFn: db.fetchMonthlyChartData,
  });
}
