import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import {
  fetchCustomReports,
  createCustomReport,
  updateCustomReport,
  deleteCustomReport,
  fetchMenuConfiguration,
  saveMenuConfiguration,
  fetchAccountMappings,
  saveAccountMapping,
  fetchFinancialStatementConfig,
  saveFinancialStatementConfig,
  fetchJournalEntryRules,
  createJournalEntryRule,
  updateJournalEntryRule,
  deleteJournalEntryRule,
  fetchDashboardConfig,
  saveDashboardConfig,
  CustomReport,
  MenuConfiguration,
  AccountMapping,
  FinancialStatementConfig,
  JournalEntryRule,
  DashboardConfig,
} from '@/services/systemControl';

// Custom Reports Hooks
export function useCustomReports() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['custom-reports', companyId],
    queryFn: () => companyId ? fetchCustomReports(companyId) : [],
    enabled: !!companyId,
  });
}

export function useCreateCustomReport() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (report: Omit<CustomReport, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => 
      createCustomReport({ ...report, company_id: companyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports', companyId] });
    },
  });
}

export function useUpdateCustomReport() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CustomReport> }) =>
      updateCustomReport(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports', companyId] });
    },
  });
}

export function useDeleteCustomReport() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: deleteCustomReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports', companyId] });
    },
  });
}

// Menu Configuration Hooks
export function useMenuConfiguration() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['menu-configuration', companyId],
    queryFn: () => companyId ? fetchMenuConfiguration(companyId) : null,
    enabled: !!companyId,
  });
}

export function useSaveMenuConfiguration() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (config: Partial<MenuConfiguration>) => 
      saveMenuConfiguration(companyId!, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-configuration', companyId] });
    },
  });
}

// Account Mappings Hooks
export function useAccountMappings() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['account-mappings', companyId],
    queryFn: () => companyId ? fetchAccountMappings(companyId) : [],
    enabled: !!companyId,
  });
}

export function useSaveAccountMapping() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (mapping: Omit<AccountMapping, 'id' | 'company_id'>) =>
      saveAccountMapping({ ...mapping, company_id: companyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-mappings', companyId] });
    },
  });
}

// Financial Statement Config Hooks
export function useFinancialStatementConfig(statementType: string) {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['financial-statement-config', companyId, statementType],
    queryFn: () => companyId ? fetchFinancialStatementConfig(companyId, statementType) : null,
    enabled: !!companyId && !!statementType,
  });
}

export function useSaveFinancialStatementConfig() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (config: Omit<FinancialStatementConfig, 'id' | 'company_id'>) =>
      saveFinancialStatementConfig({ ...config, company_id: companyId! }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financial-statement-config', companyId, variables.statement_type] });
    },
  });
}

// Journal Entry Rules Hooks
export function useJournalEntryRules() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['journal-entry-rules', companyId],
    queryFn: () => companyId ? fetchJournalEntryRules(companyId) : [],
    enabled: !!companyId,
  });
}

export function useCreateJournalEntryRule() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (rule: Omit<JournalEntryRule, 'id' | 'company_id'>) =>
      createJournalEntryRule({ ...rule, company_id: companyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entry-rules', companyId] });
    },
  });
}

export function useUpdateJournalEntryRule() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<JournalEntryRule> }) =>
      updateJournalEntryRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entry-rules', companyId] });
    },
  });
}

export function useDeleteJournalEntryRule() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: deleteJournalEntryRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entry-rules', companyId] });
    },
  });
}

// Dashboard Configuration Hooks
export function useDashboardConfig() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['dashboard-config', companyId],
    queryFn: () => companyId ? fetchDashboardConfig(companyId) : null,
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutes - config rarely changes
  });
}

export function useSaveDashboardConfig() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (config: Partial<DashboardConfig>) => 
      saveDashboardConfig(companyId!, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config', companyId] });
    },
  });
}
