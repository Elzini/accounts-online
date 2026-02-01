import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInstallmentSales,
  fetchInstallmentSale,
  addInstallmentSale,
  updateInstallmentSale,
  recordPayment,
  getOverduePayments,
  InstallmentSaleInsert,
} from '@/services/installments';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export function useInstallmentSales() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  
  return useQuery({
    queryKey: ['installmentSales', companyId, selectedFiscalYear?.id],
    queryFn: () => fetchInstallmentSales(
      companyId || undefined,
      selectedFiscalYear?.start_date,
      selectedFiscalYear?.end_date
    ),
    enabled: !!companyId,
  });
}

export function useInstallmentSale(id: string | null) {
  return useQuery({
    queryKey: ['installmentSale', id],
    queryFn: () => fetchInstallmentSale(id!),
    enabled: !!id,
  });
}

export function useAddInstallmentSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addInstallmentSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installmentSales'] });
    },
  });
}

export function useUpdateInstallmentSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InstallmentSaleInsert> }) =>
      updateInstallmentSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installmentSales'] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, amount, method, date }: { paymentId: string; amount: number; method: string; date?: string }) =>
      recordPayment(paymentId, amount, method, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installmentSales'] });
      queryClient.invalidateQueries({ queryKey: ['installmentSale'] });
      queryClient.invalidateQueries({ queryKey: ['overduePayments'] });
    },
  });
}

export function useOverduePayments() {
  return useQuery({
    queryKey: ['overduePayments'],
    queryFn: getOverduePayments,
  });
}
