import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVouchers,
  fetchVouchersByType,
  addVoucher,
  updateVoucher,
  deleteVoucher,
  VoucherInsert,
} from '@/services/vouchers';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export function useVouchers() {
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  return useQuery({
    queryKey: ['vouchers', fyId],
    queryFn: () => fetchVouchers(fyId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReceiptVouchers() {
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  return useQuery({
    queryKey: ['vouchers', 'receipt', fyId],
    queryFn: () => fetchVouchersByType('receipt', fyId),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentVouchers() {
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  return useQuery({
    queryKey: ['vouchers', 'payment', fyId],
    queryFn: () => fetchVouchersByType('payment', fyId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}

export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VoucherInsert> }) =>
      updateVoucher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}
