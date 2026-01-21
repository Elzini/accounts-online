import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  fetchBankStatements,
  importBankStatement,
  fetchBankTransactions,
  matchTransaction,
  unmatchTransaction,
  fetchBankReconciliations,
  createBankReconciliation,
  updateBankReconciliation,
  BankAccountInsert,
  BankTransaction,
} from '@/services/banking';

// Bank Accounts Hooks
export function useBankAccounts() {
  return useQuery({
    queryKey: ['bankAccounts'],
    queryFn: fetchBankAccounts,
  });
}

export function useAddBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankAccountInsert> }) =>
      updateBankAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}

// Bank Statements Hooks
export function useBankStatements(bankAccountId?: string) {
  return useQuery({
    queryKey: ['bankStatements', bankAccountId],
    queryFn: () => fetchBankStatements(bankAccountId),
  });
}

export function useImportBankStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bankAccountId,
      companyId,
      statementDate,
      transactions,
      fileName,
    }: {
      bankAccountId: string;
      companyId: string;
      statementDate: string;
      transactions: Omit<BankTransaction, 'id' | 'statement_id' | 'bank_account_id' | 'created_at' | 'is_matched'>[];
      fileName?: string;
    }) => importBankStatement(bankAccountId, companyId, statementDate, transactions, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankStatements'] });
      queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
    },
  });
}

// Bank Transactions Hooks
export function useBankTransactions(statementId: string) {
  return useQuery({
    queryKey: ['bankTransactions', statementId],
    queryFn: () => fetchBankTransactions(statementId),
    enabled: !!statementId,
  });
}

export function useMatchTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      transactionId,
      matchedType,
      matchedId,
    }: {
      transactionId: string;
      matchedType: string;
      matchedId: string;
    }) => matchTransaction(transactionId, matchedType, matchedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankStatements'] });
    },
  });
}

export function useUnmatchTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unmatchTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankStatements'] });
    },
  });
}

// Bank Reconciliations Hooks
export function useBankReconciliations(bankAccountId?: string) {
  return useQuery({
    queryKey: ['bankReconciliations', bankAccountId],
    queryFn: () => fetchBankReconciliations(bankAccountId),
  });
}

export function useCreateBankReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bankAccountId,
      companyId,
      reconciliationDate,
      statementEndingBalance,
      bookBalance,
    }: {
      bankAccountId: string;
      companyId: string;
      reconciliationDate: string;
      statementEndingBalance: number;
      bookBalance: number;
    }) =>
      createBankReconciliation(
        bankAccountId,
        companyId,
        reconciliationDate,
        statementEndingBalance,
        bookBalance
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankReconciliations'] });
    },
  });
}

export function useUpdateBankReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<typeof updateBankReconciliation>[1];
    }) => updateBankReconciliation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankReconciliations'] });
    },
  });
}
