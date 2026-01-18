import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVouchers,
  fetchVouchersByType,
  addVoucher,
  updateVoucher,
  deleteVoucher,
  VoucherInsert,
} from '@/services/vouchers';

export function useVouchers() {
  return useQuery({
    queryKey: ['vouchers'],
    queryFn: fetchVouchers,
  });
}

export function useReceiptVouchers() {
  return useQuery({
    queryKey: ['vouchers', 'receipt'],
    queryFn: () => fetchVouchersByType('receipt'),
  });
}

export function usePaymentVouchers() {
  return useQuery({
    queryKey: ['vouchers', 'payment'],
    queryFn: () => fetchVouchersByType('payment'),
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
