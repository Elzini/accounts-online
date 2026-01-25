import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  fetchExpenses,
  fetchCarExpenses,
  fetchGeneralExpenses,
  getCarExpensesTotal,
  addExpense,
  updateExpense,
  deleteExpense,
  createDefaultExpenseCategories,
  ExpenseCategoryInsert,
  ExpenseInsert,
} from '@/services/expenses';

// Expense Categories Hooks
export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expenseCategories'],
    queryFn: fetchExpenseCategories,
  });
}

export function useAddExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseCategoryInsert> }) =>
      updateExpenseCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    },
  });
}

export function useCreateDefaultExpenseCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDefaultExpenseCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    },
  });
}

// Expenses Hooks
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });
}

// Car-specific expenses
export function useCarExpenses(carId: string | null) {
  return useQuery({
    queryKey: ['car-expenses', carId],
    queryFn: () => carId ? fetchCarExpenses(carId) : [],
    enabled: !!carId,
  });
}

// General expenses (not linked to any car)
export function useGeneralExpenses(companyId: string | null) {
  return useQuery({
    queryKey: ['general-expenses', companyId],
    queryFn: () => companyId ? fetchGeneralExpenses(companyId) : [],
    enabled: !!companyId,
  });
}

// Get total expenses for a specific car
export function useCarExpensesTotal(carId: string | null) {
  return useQuery({
    queryKey: ['car-expenses-total', carId],
    queryFn: () => carId ? getCarExpensesTotal(carId) : 0,
    enabled: !!carId,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseInsert> }) =>
      updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
