import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFinancingCompanies,
  addFinancingCompany,
  updateFinancingCompany,
  deleteFinancingCompany,
  fetchFinancingContracts,
  fetchFinancingContract,
  addFinancingContract,
  updateFinancingContract,
  recordFinancingPayment,
  getOverdueFinancingPayments,
  FinancingCompanyInsert,
  FinancingContractInsert,
} from '@/services/financing';

// Financing Companies Hooks
export function useFinancingCompanies() {
  return useQuery({
    queryKey: ['financingCompanies'],
    queryFn: fetchFinancingCompanies,
  });
}

export function useAddFinancingCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFinancingCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financingCompanies'] });
    },
  });
}

export function useUpdateFinancingCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FinancingCompanyInsert> }) =>
      updateFinancingCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financingCompanies'] });
    },
  });
}

export function useDeleteFinancingCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFinancingCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financingCompanies'] });
    },
  });
}

// Financing Contracts Hooks
export function useFinancingContracts() {
  return useQuery({
    queryKey: ['financingContracts'],
    queryFn: fetchFinancingContracts,
  });
}

export function useFinancingContract(id: string | null) {
  return useQuery({
    queryKey: ['financingContract', id],
    queryFn: () => fetchFinancingContract(id!),
    enabled: !!id,
  });
}

export function useAddFinancingContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFinancingContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financingContracts'] });
    },
  });
}

export function useUpdateFinancingContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FinancingContractInsert> }) =>
      updateFinancingContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financingContracts'] });
      queryClient.invalidateQueries({ queryKey: ['financingContract'] });
    },
  });
}

export function useRecordFinancingPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      paidAmount,
      paymentMethod,
      bankReference,
      paidDate,
    }: {
      paymentId: string;
      paidAmount: number;
      paymentMethod: string;
      bankReference?: string;
      paidDate?: string;
    }) => recordFinancingPayment(paymentId, paidAmount, paymentMethod, bankReference, paidDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financingContracts'] });
      queryClient.invalidateQueries({ queryKey: ['financingContract'] });
      queryClient.invalidateQueries({ queryKey: ['overdueFinancingPayments'] });
    },
  });
}

export function useOverdueFinancingPayments() {
  return useQuery({
    queryKey: ['overdueFinancingPayments'],
    queryFn: getOverdueFinancingPayments,
  });
}
