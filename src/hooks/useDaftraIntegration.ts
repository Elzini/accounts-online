import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from './useCompanyId';
import * as daftraService from '@/services/daftraIntegration';

export function useDaftraConfig() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['daftra-config', companyId],
    queryFn: () => daftraService.getDaftraConfig(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDaftraAuthenticate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { companyId: string; credentials: Parameters<typeof daftraService.authenticateDaftra>[1] }) =>
      daftraService.authenticateDaftra(params.companyId, params.credentials),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daftra-config'] }),
  });
}

export function useDaftraTestConnection() {
  return useMutation({
    mutationFn: (companyId: string) => daftraService.testDaftraConnection(companyId),
  });
}

export function useDaftraSyncAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { companyId: string; accounts: Parameters<typeof daftraService.syncAccountsToDaftra>[1] }) =>
      daftraService.syncAccountsToDaftra(params.companyId, params.accounts),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daftra-config'] }),
  });
}

export function useDaftraAlignCodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { companyId: string; accounts: Parameters<typeof daftraService.alignCodesToDaftra>[1] }) =>
      daftraService.alignCodesToDaftra(params.companyId, params.accounts),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daftra-config'] }),
  });
}

export function useDaftraSyncJournals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { companyId: string; entries: Parameters<typeof daftraService.syncJournalsToDaftra>[1] }) =>
      daftraService.syncJournalsToDaftra(params.companyId, params.entries),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daftra-config'] }),
  });
}

export function useDaftraSyncClients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { companyId: string; clients: Parameters<typeof daftraService.syncClientsToDaftra>[1] }) =>
      daftraService.syncClientsToDaftra(params.companyId, params.clients),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daftra-config'] }),
  });
}

export function useDaftraSyncSuppliers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { companyId: string; suppliers: Parameters<typeof daftraService.syncSuppliersToDaftra>[1] }) =>
      daftraService.syncSuppliersToDaftra(params.companyId, params.suppliers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daftra-config'] }),
  });
}

export function useDaftraResetAndSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { companyId: string; accounts: Parameters<typeof daftraService.resetAndSyncAccountsToDaftra>[1] }) =>
      daftraService.resetAndSyncAccountsToDaftra(params.companyId, params.accounts),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daftra-config'] }),
  });
}

export function useDaftraDeleteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => daftraService.deleteDaftraConfig(companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daftra-config'] }),
  });
}
