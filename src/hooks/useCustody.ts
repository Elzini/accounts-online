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
  getEmployeeCarriedBalance,
  resolveCarriedCustodies,
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

  // Add custody mutation (auto-deducts carried balance for employee)
  const addCustodyMutation = useMutation({
    mutationFn: async (data: Omit<CustodyInsert, 'company_id'>) => {
      if (!companyId) throw new Error('Company ID is required');
      
      let deductedAmount = 0;
      
      // Check if employee has carried balance and deduct it
      if (data.employee_id) {
        const carriedBalance = await getEmployeeCarriedBalance(companyId, data.employee_id);
        if (carriedBalance > 0) {
          deductedAmount = carriedBalance;
          // Resolve the carried custodies
          await resolveCarriedCustodies(companyId, data.employee_id);
        }
      }
      
      if (deductedAmount > 0 && deductedAmount >= data.custody_amount) {
        // Carried balance is >= new custody: no active custody needed
        // Remaining debt = carried - newAmount
        const remainingDebt = deductedAmount - data.custody_amount;
        
        if (remainingDebt > 0) {
          // Still owed to employee, create a reduced carried record
          return addCustody({
            ...data,
            company_id: companyId,
            custody_amount: remainingDebt,
            custody_date: data.custody_date,
            status: 'carried',
            fiscal_year_id: selectedFiscalYear?.id || null,
            notes: `رصيد مرحّل محدّث - تم خصم ${data.custody_amount} ر.س من مرحّل سابق ${deductedAmount} ر.س`,
          });
        } else {
          // Exact match - debt fully settled, create a settled record
          return addCustody({
            ...data,
            company_id: companyId,
            custody_amount: 0,
            status: 'settled',
            settlement_date: data.custody_date,
            fiscal_year_id: selectedFiscalYear?.id || null,
            notes: `تم تسوية الرصيد المرحّل بالكامل (${deductedAmount} ر.س)`,
          });
        }
      }
      
      // Normal case: new custody > carried balance
      const adjustedAmount = data.custody_amount - deductedAmount;
      const notes = deductedAmount > 0
        ? `${data.notes || ''}\nتم خصم ${deductedAmount} ر.س رصيد مرحّل من عهدة سابقة`.trim()
        : data.notes;
      
      return addCustody({
        ...data,
        custody_amount: adjustedAmount,
        notes,
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

  // Settle custody mutation (with optional carry-forward as 'carried' record)
  const settleCustodyMutation = useMutation({
    mutationFn: async ({ id, settlementDate, carriedBalance, employeeId, employeeName }: { 
      id: string; 
      settlementDate: string;
      carriedBalance?: number;
      employeeId?: string | null;
      employeeName?: string;
    }) => {
      const result = await settleCustody(id, settlementDate);
      
      // If there's a carried balance, create a 'carried' record (not a new active custody)
      if (carriedBalance && carriedBalance > 0 && companyId) {
        await addCustody({
          company_id: companyId,
          custody_name: `رصيد مرحّل - ${employeeName || 'غير محدد'}`,
          custody_amount: carriedBalance,
          custody_date: settlementDate,
          status: 'carried',
          employee_id: employeeId || null,
          fiscal_year_id: selectedFiscalYear?.id || null,
          notes: `مرحّل من العهدة المصفاة بتاريخ ${settlementDate}`,
          settlement_date: null,
          created_by: null,
        });
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      if (variables.carriedBalance && variables.carriedBalance > 0) {
        toast.success(`تم تصفية العهدة وترحيل ${variables.carriedBalance} ر.س كرصيد مرحّل`);
      } else {
        toast.success('تم تصفية العهدة بنجاح');
      }
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
