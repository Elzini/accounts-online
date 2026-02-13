import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from './useCompanyId';
import * as zatcaService from '@/services/zatcaIntegration';

export function useZatcaConfig() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['zatca-config', companyId],
    queryFn: () => zatcaService.fetchZatcaConfig(companyId!),
    enabled: !!companyId,
  });
}

export function useSaveZatcaConfig() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: (config: Partial<zatcaService.ZatcaConfig>) =>
      zatcaService.saveZatcaConfig({ ...config, company_id: companyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zatca-config'] }),
  });
}

export function useZatcaInvoices() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['zatca-invoices', companyId],
    queryFn: () => zatcaService.fetchZatcaInvoices(companyId!),
    enabled: !!companyId,
  });
}

export function useCallZatcaAPI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: zatcaService.callZatcaAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zatca-config'] });
      qc.invalidateQueries({ queryKey: ['zatca-invoices'] });
    },
  });
}

export function useCreateZatcaInvoiceLog() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: (log: Partial<zatcaService.ZatcaInvoiceLog>) =>
      zatcaService.createZatcaInvoiceLog({ ...log, company_id: companyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zatca-invoices'] }),
  });
}
