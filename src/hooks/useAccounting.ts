import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import {
  fetchTaxSettings,
  upsertTaxSettings,
  fetchAccounts,
  createDefaultAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  fetchJournalEntries,
  fetchJournalEntryWithLines,
  createJournalEntry,
  deleteJournalEntry,
  getAccountBalances,
  getTrialBalance,
  getIncomeStatement,
  getGeneralLedger,
  TaxSettings,
  AccountCategory,
  JournalEntry,
} from '@/services/accounting';

// Tax Settings
export function useTaxSettings() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['tax-settings', companyId],
    queryFn: () => companyId ? fetchTaxSettings(companyId) : null,
    enabled: !!companyId,
  });
}

export function useUpsertTaxSettings() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (settings: Partial<TaxSettings>) => {
      if (!companyId) throw new Error('Company ID required');
      return upsertTaxSettings(companyId, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-settings', companyId] });
    },
  });
}

// Accounts (Chart of Accounts)
export function useAccounts() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['accounts', companyId],
    queryFn: () => companyId ? fetchAccounts(companyId) : [],
    enabled: !!companyId,
  });
}

export function useCreateDefaultAccounts() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: () => {
      if (!companyId) throw new Error('Company ID required');
      return createDefaultAccounts(companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', companyId] });
    },
  });
}

export function useAddAccount() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (account: Omit<AccountCategory, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
      if (!companyId) throw new Error('Company ID required');
      return addAccount({ ...account, company_id: companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', companyId] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AccountCategory> }) => {
      return updateAccount(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', companyId] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', companyId] });
    },
  });
}

// Journal Entries
export function useJournalEntries() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['journal-entries', companyId],
    queryFn: () => companyId ? fetchJournalEntries(companyId) : [],
    enabled: !!companyId,
  });
}

export function useJournalEntry(entryId: string | null) {
  return useQuery({
    queryKey: ['journal-entry', entryId],
    queryFn: () => entryId ? fetchJournalEntryWithLines(entryId) : null,
    enabled: !!entryId,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ 
      entry, 
      lines 
    }: { 
      entry: Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines' | 'company_id'>;
      lines: Array<{ account_id: string; description?: string; debit: number; credit: number }>;
    }) => {
      if (!companyId) throw new Error('Company ID required');
      return createJournalEntry({ ...entry, company_id: companyId }, lines);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['income-statement', companyId] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: deleteJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['income-statement', companyId] });
    },
  });
}

// Reports
export function useAccountBalances() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['account-balances', companyId],
    queryFn: () => companyId ? getAccountBalances(companyId) : [],
    enabled: !!companyId,
  });
}

export function useTrialBalance() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['trial-balance', companyId],
    queryFn: () => companyId ? getTrialBalance(companyId) : null,
    enabled: !!companyId,
  });
}

export function useIncomeStatement(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['income-statement', companyId, startDate, endDate],
    queryFn: () => companyId ? getIncomeStatement(companyId, startDate, endDate) : null,
    enabled: !!companyId,
  });
}

// General Ledger
export function useGeneralLedger(accountId: string | null, startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['general-ledger', companyId, accountId, startDate, endDate],
    queryFn: () => companyId && accountId ? getGeneralLedger(companyId, accountId, startDate, endDate) : null,
    enabled: !!companyId && !!accountId,
  });
}
