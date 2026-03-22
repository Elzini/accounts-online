import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
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
  updateJournalEntry,
  deleteJournalEntry,
  getAccountBalances,
  getTrialBalance,
  getIncomeStatement,
  getGeneralLedger,
  getBalanceSheet,
  getVouchersReport,
  getJournalEntriesReport,
  getComprehensiveTrialBalance,
  getVATSettlementReport,
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
    onSuccess: (data) => {
      queryClient.setQueryData(['tax-settings', companyId], data);
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
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['journal-entries', companyId, fyId],
    queryFn: () => companyId ? fetchJournalEntries(companyId, fyId) : [],
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
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['income-statement', companyId] });
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', companyId] });
      queryClient.invalidateQueries({ queryKey: ['vat-settlement-report', companyId] });
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
      queryClient.invalidateQueries({ queryKey: ['journal-entry'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['income-statement', companyId] });
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', companyId] });
      queryClient.invalidateQueries({ queryKey: ['vat-settlement-report', companyId] });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ 
      entryId,
      entry, 
      lines 
    }: { 
      entryId: string;
      entry: Partial<Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>>;
      lines: Array<{ id?: string; account_id: string; description?: string; debit: number; credit: number }>;
    }) => {
      return updateJournalEntry(entryId, entry, lines);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', companyId] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance', companyId] });
      queryClient.invalidateQueries({ queryKey: ['income-statement', companyId] });
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', companyId] });
      queryClient.invalidateQueries({ queryKey: ['vat-settlement-report', companyId] });
    },
  });
}

// Reports
export function useAccountBalances() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['account-balances', companyId, fyId],
    queryFn: () => companyId ? getAccountBalances(companyId, undefined, undefined, fyId) : [],
    enabled: !!companyId,
  });
}

export function useAccountBalancesByDate(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['account-balances', companyId, startDate, endDate, fyId],
    queryFn: () => companyId ? getAccountBalances(companyId, startDate, endDate, fyId) : [],
    enabled: !!companyId,
  });
}

export function useTrialBalance(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['trial-balance', companyId, startDate, endDate, fyId],
    queryFn: () => companyId ? getTrialBalance(companyId, startDate, endDate, fyId) : null,
    enabled: !!companyId,
  });
}

export function useIncomeStatement(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['income-statement', companyId, startDate, endDate, fyId],
    queryFn: () => companyId ? getIncomeStatement(companyId, startDate, endDate, fyId) : null,
    enabled: !!companyId,
  });
}

// General Ledger
export function useGeneralLedger(accountId: string | null, startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['general-ledger', companyId, accountId, startDate, endDate, fyId],
    queryFn: () => companyId && accountId ? getGeneralLedger(companyId, accountId, startDate, endDate, fyId) : null,
    enabled: !!companyId && !!accountId,
  });
}

// Balance Sheet - الميزانية العمومية
export function useBalanceSheet(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['balance-sheet', companyId, startDate, endDate, fyId],
    queryFn: () => companyId ? getBalanceSheet(companyId, startDate, endDate, fyId) : null,
    enabled: !!companyId,
  });
}

// Vouchers Report - كشف السندات
export function useVouchersReport(startDate?: string, endDate?: string, voucherType?: 'receipt' | 'payment') {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['vouchers-report', companyId, startDate, endDate, voucherType, fyId],
    queryFn: () => companyId ? getVouchersReport(companyId, startDate, endDate, voucherType, fyId) : [],
    enabled: !!companyId,
  });
}

// Journal Entries Report - كشف القيود
export function useJournalEntriesReport(startDate?: string, endDate?: string, referenceType?: string) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['journal-entries-report', companyId, startDate, endDate, referenceType, fyId],
    queryFn: () => companyId ? getJournalEntriesReport(companyId, startDate, endDate, referenceType, fyId) : [],
    enabled: !!companyId,
  });
}

// Comprehensive Trial Balance - ميزان المراجعة الشامل
export function useComprehensiveTrialBalance(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['comprehensive-trial-balance', companyId, startDate, endDate, fyId],
    queryFn: () => companyId ? getComprehensiveTrialBalance(companyId, startDate, endDate, fyId) : null,
    enabled: !!companyId,
  });
}

// VAT Settlement Report - تقرير تسوية ضريبة القيمة المضافة
export function useVATSettlementReport(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fyId = selectedFiscalYear?.id;
  
  return useQuery({
    queryKey: ['vat-settlement-report', companyId, startDate, endDate, fyId],
    queryFn: () => companyId ? getVATSettlementReport(companyId, startDate, endDate, fyId) : null,
    enabled: !!companyId,
  });
}
