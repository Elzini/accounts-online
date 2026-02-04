import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from './useCompanyId';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import {
  fetchCustodies,
  fetchCustodyWithTransactions,
  addCustody,
  updateCustody,
  deleteCustody,
  addCustodyTransaction,
  updateCustodyTransaction,
  deleteCustodyTransaction,
  settleCustody,
  CustodyInsert,
  CustodyTransactionInsert,
  Custody,
} from '@/services/custody';
import { toast } from 'sonner';

export function useCustody() {
  const companyId = useCompanyId();
  const { selectedFiscalYear, filterByFiscalYear } = useFiscalYearFilter();
  const queryClient = useQueryClient();

  // Fetch all custodies
  const { data: allCustodies = [], isLoading, error, refetch } = useQuery({
    queryKey: ['custodies', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return await fetchCustodies(companyId);
    },
    enabled: !!companyId,
  });

  // Apply strict date filtering client-side (outside queryFn to avoid closure issues)
  const custodies = filterByFiscalYear(allCustodies, 'custody_date');

  // Add custody mutation
  const addCustodyMutation = useMutation({
    mutationFn: (data: Omit<CustodyInsert, 'company_id'>) => {
      if (!companyId) throw new Error('Company ID is required');
      return addCustody({
        ...data,
        company_id: companyId,
        fiscal_year_id: selectedFiscalYear?.id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم إضافة العهدة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في إضافة العهدة: ${error.message}`);
    },
  });

  // Update custody mutation
  const updateCustodyMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CustodyInsert> }) =>
      updateCustody(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم تحديث العهدة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تحديث العهدة: ${error.message}`);
    },
  });

  // Delete custody mutation
  const deleteCustodyMutation = useMutation({
    mutationFn: deleteCustody,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم حذف العهدة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في حذف العهدة: ${error.message}`);
    },
  });

  // Settle custody mutation
  const settleCustodyMutation = useMutation({
    mutationFn: ({ id, settlementDate }: { id: string; settlementDate: string }) =>
      settleCustody(id, settlementDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم تصفية العهدة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تصفية العهدة: ${error.message}`);
    },
  });

  return {
    custodies,
    isLoading,
    error,
    refetch,
    addCustody: addCustodyMutation.mutate,
    updateCustody: updateCustodyMutation.mutate,
    deleteCustody: deleteCustodyMutation.mutate,
    settleCustody: settleCustodyMutation.mutate,
    isAdding: addCustodyMutation.isPending,
    isUpdating: updateCustodyMutation.isPending,
    isDeleting: deleteCustodyMutation.isPending,
    isSettling: settleCustodyMutation.isPending,
  };
}

// Hook for single custody with transactions
export function useCustodyDetails(custodyId: string | null) {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: custody, isLoading, error, refetch } = useQuery({
    queryKey: ['custody', custodyId],
    queryFn: () => (custodyId ? fetchCustodyWithTransactions(custodyId) : null),
    enabled: !!custodyId,
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: (data: Omit<CustodyTransactionInsert, 'company_id' | 'custody_id'>) => {
      if (!companyId || !custodyId) throw new Error('Company ID and Custody ID are required');
      return addCustodyTransaction({
        ...data,
        company_id: companyId,
        custody_id: custodyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custody', custodyId] });
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم إضافة المصروف بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في إضافة المصروف: ${error.message}`);
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CustodyTransactionInsert> }) =>
      updateCustodyTransaction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custody', custodyId] });
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم تحديث المصروف بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تحديث المصروف: ${error.message}`);
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: deleteCustodyTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custody', custodyId] });
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم حذف المصروف بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في حذف المصروف: ${error.message}`);
    },
  });

  return {
    custody,
    isLoading,
    error,
    refetch,
    addTransaction: addTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    isAddingTransaction: addTransactionMutation.isPending,
    isUpdatingTransaction: updateTransactionMutation.isPending,
    isDeletingTransaction: deleteTransactionMutation.isPending,
  };
}
