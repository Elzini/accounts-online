import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPrepaidExpenses,
  fetchPrepaidExpenseAmortizations,
  createPrepaidExpense,
  updatePrepaidExpense,
  deletePrepaidExpense,
  processAmortization,
  processAllDueAmortizations,
  CreatePrepaidExpenseInput,
  PrepaidExpense,
} from '@/services/prepaidExpenses';
import { useCompany } from '@/contexts/CompanyContext';

export function usePrepaidExpenses() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['prepaid-expenses', companyId],
    queryFn: () => (companyId ? fetchPrepaidExpenses(companyId) : []),
    enabled: !!companyId,
  });
}

export function usePrepaidExpenseAmortizations(prepaidExpenseId: string | null) {
  return useQuery({
    queryKey: ['prepaid-expense-amortizations', prepaidExpenseId],
    queryFn: () =>
      prepaidExpenseId ? fetchPrepaidExpenseAmortizations(prepaidExpenseId) : [],
    enabled: !!prepaidExpenseId,
  });
}

export function useCreatePrepaidExpense() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (input: Omit<CreatePrepaidExpenseInput, 'company_id'>) =>
      createPrepaidExpense({ ...input, company_id: companyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepaid-expenses', companyId] });
    },
  });
}

export function useUpdatePrepaidExpense() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PrepaidExpense> }) =>
      updatePrepaidExpense(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepaid-expenses', companyId] });
    },
  });
}

export function useDeletePrepaidExpense() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: deletePrepaidExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepaid-expenses', companyId] });
    },
  });
}

export function useProcessAmortization() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({
      amortizationId,
      prepaidExpenseId,
      amount,
      description,
      categoryId,
      amortizationDate,
      monthNumber,
    }: {
      amortizationId: string;
      prepaidExpenseId: string;
      amount: number;
      description: string;
      categoryId: string | null;
      amortizationDate: string;
      monthNumber: number;
    }) =>
      processAmortization(
        amortizationId,
        companyId!,
        prepaidExpenseId,
        amount,
        description,
        categoryId,
        amortizationDate,
        monthNumber
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prepaid-expenses', companyId] });
      queryClient.invalidateQueries({
        queryKey: ['prepaid-expense-amortizations', variables.prepaidExpenseId],
      });
      queryClient.invalidateQueries({ queryKey: ['expenses', companyId] });
    },
  });
}

export function useProcessAllDueAmortizations() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: () => processAllDueAmortizations(companyId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepaid-expenses', companyId] });
      queryClient.invalidateQueries({ queryKey: ['prepaid-expense-amortizations'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', companyId] });
    },
  });
}
