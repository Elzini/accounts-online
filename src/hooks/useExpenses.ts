import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  fetchExpenses,
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
