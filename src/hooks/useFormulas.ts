// Hook for managing formulas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import * as formulaService from '@/services/formulas';
import { toast } from 'sonner';

export function useFormulaVariables() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['formula-variables', companyId],
    queryFn: () => formulaService.fetchFormulaVariables(companyId),
  });
}

export function useFormulaDefinitions(category?: string) {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['formula-definitions', companyId, category],
    queryFn: () => {
      if (!companyId) throw new Error('No company selected');
      return formulaService.fetchFormulaDefinitions(companyId, category);
    },
    enabled: !!companyId,
  });
}

export function useSaveFormula() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (formula: Partial<formulaService.FormulaDefinition>) => {
      if (!companyId) throw new Error('No company selected');
      return formulaService.saveFormulaDefinition({ ...formula, company_id: companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-definitions'] });
      toast.success('تم حفظ المعادلة بنجاح');
    },
    onError: (error: any) => {
      console.error('Error saving formula:', error);
      toast.error('حدث خطأ أثناء حفظ المعادلة');
    },
  });
}

export function useDeleteFormula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: formulaService.deleteFormulaDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-definitions'] });
      toast.success('تم حذف المعادلة');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المعادلة');
    },
  });
}

export function useCreateVariable() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (variable: Partial<formulaService.FormulaVariable>) => {
      if (!companyId) throw new Error('No company selected');
      return formulaService.createCustomVariable({ ...variable, company_id: companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-variables'] });
      toast.success('تم إنشاء المتغير بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إنشاء المتغير');
    },
  });
}

export function useDeleteVariable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: formulaService.deleteCustomVariable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-variables'] });
      toast.success('تم حذف المتغير');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المتغير');
    },
  });
}
