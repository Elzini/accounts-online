/**
 * Returns Service Hooks
 * Centralized data access for credit/debit notes.
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreditDebitNotes(companyId: string | null) {
  return useQuery({
    queryKey: ['credit-debit-notes', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_debit_notes').select('*')
        .eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCreditDebitNote(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: { note_number: string; note_type: string; note_date: string; total_amount: number; reason?: string | null; status: string }) => {
      const { error } = await supabase.from('credit_debit_notes').insert({ company_id: companyId!, ...row });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] }),
  });
}

export function useDeleteCreditDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] }),
  });
}
