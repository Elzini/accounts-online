import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCompanyId } from '@/hooks/useCompanyId';
import { completeUnitSale, recordAdvancePayment, recordProjectCost, calculateUnitCost, getProjectProfitability } from '@/services/realEstateAccounting';

// ============================================================
// Per-unit cost allocation (client-side, from loaded data)
// ============================================================
export interface UnitCostAllocation {
  unitId: string;
  unitNumber: string;
  projectId: string;
  projectName: string;
  unitArea: number;
  totalProjectArea: number;
  totalProjectCost: number;
  areaPercentage: number;
  costPerSqm: number;
  allocatedCost: number;
  salePrice: number;
  profit: number;
  profitMargin: number;
  status: string;
}

export function useProjectCostAllocations(projects: any[] | undefined, units: any[] | undefined): UnitCostAllocation[] {
  return useMemo(() => {
    if (!projects?.length || !units?.length) return [];

    const allocations: UnitCostAllocation[] = [];

    for (const project of projects) {
      const projectUnits = units.filter((u: any) => u.project_id === project.id);
      if (!projectUnits.length) continue;

      const totalProjectCost = Number(project.total_spent || 0);
      const totalProjectArea = projectUnits.reduce((s: number, u: any) => s + Number(u.area || 0), 0);
      const costPerSqm = totalProjectArea > 0 ? totalProjectCost / totalProjectArea : 0;

      for (const unit of projectUnits) {
        const unitArea = Number(unit.area || 0);
        const areaPercentage = totalProjectArea > 0 ? (unitArea / totalProjectArea) * 100 : (100 / projectUnits.length);
        
        // Proportional cost: by area if available, otherwise equal split
        const allocatedCost = totalProjectArea > 0 && unitArea > 0
          ? unitArea * costPerSqm
          : projectUnits.length > 0 ? totalProjectCost / projectUnits.length : 0;

        const salePrice = Number(unit.sale_price || unit.price || 0);
        const effectiveCost = unit.status === 'sold' && unit.cost > 0 ? Number(unit.cost) : allocatedCost;
        const profit = salePrice > 0 ? salePrice - effectiveCost : 0;
        const profitMargin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

        allocations.push({
          unitId: unit.id,
          unitNumber: unit.unit_number,
          projectId: project.id,
          projectName: project.name,
          unitArea,
          totalProjectArea,
          totalProjectCost,
          areaPercentage,
          costPerSqm,
          allocatedCost,
          salePrice: unit.status === 'sold' ? salePrice : 0,
          profit,
          profitMargin,
          status: unit.status,
        });
      }
    }

    return allocations;
  }, [projects, units]);
}

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
