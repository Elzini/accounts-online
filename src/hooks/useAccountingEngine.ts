/**
 * React Hooks for Core Accounting Engine
 * Provides easy access to engine services from components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { loadCompanyConfig, loadCurrentFiscalYear } from '@/core/engine/companyConfigLoader';
import { AccountResolver } from '@/core/engine/accountResolver';
import { JournalEngine } from '@/core/engine/journalEngine';
import { InvoicePostingEngine } from '@/core/engine/invoicePostingEngine';
import { ModuleRegistry } from '@/core/engine/moduleRegistry';
import { CompanyConfig, FiscalYear, JournalEntryInput, IndustryModule } from '@/core/engine/types';
// Register all modules on first import
import '@/core/modules';

/**
 * Load unified company configuration
 */
export function useCompanyConfig() {
  const { companyId } = useCompany();
  
  return useQuery<CompanyConfig | null>({
    queryKey: ['company-config', companyId],
    queryFn: () => companyId ? loadCompanyConfig(companyId) : null,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });
}

/**
 * Load current fiscal year
 */
export function useCurrentFiscalYear() {
  const { companyId } = useCompany();
  
  return useQuery<FiscalYear | null>({
    queryKey: ['current-fiscal-year', companyId],
    queryFn: () => companyId ? loadCurrentFiscalYear(companyId) : null,
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get the industry module for the current company
 */
export function useIndustryModule(): IndustryModule | null {
  const { data: config } = useCompanyConfig();
  if (!config) return null;
  return ModuleRegistry.getForType(config.company_type);
}

/**
 * Pre-loaded AccountResolver instance (cached per company)
 */
export function useAccountResolver() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['account-resolver', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const resolver = new AccountResolver(companyId);
      await resolver.load();
      return resolver;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create journal entry using the core engine
 */
export function useCreateJournalEntry() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: Omit<JournalEntryInput, 'company_id'> & { company_id?: string }) => {
      const cid = input.company_id || companyId;
      if (!cid) throw new Error('Company ID is required');
      const engine = new JournalEngine(cid);
      return engine.createEntry({ ...input, company_id: cid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
    },
  });
}

/**
 * Post an invoice as a journal entry using the core engine
 */
export function usePostInvoice() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!companyId) throw new Error('Company ID is required');
      const engine = new InvoicePostingEngine(companyId);
      return engine.postInvoice(invoiceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}
