import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPartnerDealerships,
  addPartnerDealership,
  updatePartnerDealership,
  deletePartnerDealership,
  fetchCarTransfers,
  addCarTransfer,
  updateCarTransfer,
  deleteCarTransfer,
  PartnerDealershipInsert,
  CarTransferInsert,
} from '@/services/transfers';

// Partner Dealerships hooks
export function usePartnerDealerships() {
  return useQuery({
    queryKey: ['partnerDealerships'],
    queryFn: fetchPartnerDealerships,
  });
}

export function useAddPartnerDealership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPartnerDealership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerDealerships'] });
    },
  });
}

export function useUpdatePartnerDealership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PartnerDealershipInsert> }) =>
      updatePartnerDealership(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerDealerships'] });
    },
  });
}

export function useDeletePartnerDealership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePartnerDealership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerDealerships'] });
    },
  });
}

// Car Transfers hooks
export function useCarTransfers() {
  return useQuery({
    queryKey: ['carTransfers'],
    queryFn: fetchCarTransfers,
  });
}

export function useAddCarTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCarTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carTransfers'] });
    },
  });
}

export function useUpdateCarTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CarTransferInsert> }) =>
      updateCarTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carTransfers'] });
    },
  });
}

export function useDeleteCarTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCarTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carTransfers'] });
    },
  });
}
