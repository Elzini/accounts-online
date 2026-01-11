import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/services/database';
import type { Database } from '@/integrations/supabase/types';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type CarInsert = Database['public']['Tables']['cars']['Insert'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];

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

// Stats hook
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: db.fetchStats,
  });
}
