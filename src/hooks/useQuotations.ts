import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchQuotations,
  fetchQuotation,
  addQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToSale,
  QuotationInsert,
  QuotationItemInsert,
} from '@/services/quotations';

export function useQuotations() {
  return useQuery({
    queryKey: ['quotations'],
    queryFn: fetchQuotations,
  });
}

export function useQuotation(id: string | null) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: () => fetchQuotation(id!),
    enabled: !!id,
  });
}

export function useAddQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotation, items }: { quotation: QuotationInsert; items: Omit<QuotationItemInsert, 'quotation_id'>[] }) =>
      addQuotation(quotation, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QuotationInsert> }) =>
      updateQuotation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useConvertQuotationToSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: convertQuotationToSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}
