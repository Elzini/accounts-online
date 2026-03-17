import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCompanyId } from '@/hooks/useCompanyId';
import { completeUnitSale, recordAdvancePayment, recordProjectCost, calculateUnitCost, getProjectProfitability } from '@/services/realEstateAccounting';

export function useCompleteUnitSale() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (params: {
      unitId: string;
      unitNumber: string;
      projectId: string;
      projectName: string;
      customerId: string;
      customerName: string;
      salePrice: number;
      advancePayments?: number;
      vatRate?: number;
      fiscalYearId?: string;
    }) => {
      if (!companyId) throw new Error('Company ID required');
      return completeUnitSale({ ...params, companyId });
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['re-units'] });
      qc.invalidateQueries({ queryKey: ['re-dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success(`تم تسجيل البيع بنجاح — تكلفة الوحدة: ${Math.round(result.unitCost).toLocaleString('ar-SA')} ر.س`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRecordAdvancePayment() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (params: {
      unitId: string;
      unitNumber: string;
      projectName: string;
      customerId: string;
      customerName: string;
      amount: number;
      fiscalYearId?: string;
    }) => {
      if (!companyId) throw new Error('Company ID required');
      return recordAdvancePayment({ ...params, companyId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('تم تسجيل الدفعة المقدمة كالتزام بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRecordProjectCost() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      projectName: string;
      description: string;
      amount: number;
      costType: string;
      paymentAccountCode?: string;
      fiscalYearId?: string;
    }) => {
      if (!companyId) throw new Error('Company ID required');
      return recordProjectCost({ ...params, companyId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-costs'] });
      qc.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('تم تسجيل تكلفة المشروع كأصل (مشاريع تحت التطوير)');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCalculateUnitCost() {
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (params: { projectId: string; unitId: string }) => {
      if (!companyId) throw new Error('Company ID required');
      return calculateUnitCost({ ...params, companyId });
    },
  });
}

export function useProjectProfitability() {
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!companyId) throw new Error('Company ID required');
      return getProjectProfitability(companyId, projectId);
    },
  });
}
