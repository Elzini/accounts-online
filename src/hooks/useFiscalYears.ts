import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchFiscalYears,
  getCurrentFiscalYear,
  createFiscalYear,
  updateFiscalYear,
  setCurrentFiscalYear,
  setUserFiscalYear,
  getUserFiscalYear,
  closeFiscalYear,
  openNewFiscalYear,
  deleteFiscalYear,
  FiscalYear,
} from '@/services/fiscalYears';
import { toast } from 'sonner';

export function useFiscalYears() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['fiscal-years', companyId],
    queryFn: () => {
      if (!companyId) return [];
      return fetchFiscalYears(companyId);
    },
    enabled: !!companyId,
  });
}

export function useCurrentFiscalYear() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['current-fiscal-year', companyId],
    queryFn: () => {
      if (!companyId) return null;
      return getCurrentFiscalYear(companyId);
    },
    enabled: !!companyId,
  });
}

export function useUserFiscalYear() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-fiscal-year', user?.id],
    queryFn: () => {
      if (!user?.id) return null;
      return getUserFiscalYear(user.id);
    },
    enabled: !!user?.id,
  });
}

export function useCreateFiscalYear() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (data: {
      name: string;
      start_date: string;
      end_date: string;
      is_current?: boolean;
      notes?: string;
    }) => {
      if (!companyId) throw new Error('No company');
      return createFiscalYear({
        ...data,
        company_id: companyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      queryClient.invalidateQueries({ queryKey: ['current-fiscal-year'] });
      toast.success('تم إنشاء السنة المالية بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل إنشاء السنة المالية');
    },
  });
}

export function useUpdateFiscalYear() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FiscalYear> }) => 
      updateFiscalYear(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      queryClient.invalidateQueries({ queryKey: ['current-fiscal-year'] });
      toast.success('تم تحديث السنة المالية');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل التحديث');
    },
  });
}

export function useSetCurrentFiscalYear() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => setCurrentFiscalYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      queryClient.invalidateQueries({ queryKey: ['current-fiscal-year'] });
      toast.success('تم تعيين السنة المالية الحالية');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل تعيين السنة المالية');
    },
  });
}

export function useSetUserFiscalYear() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (fiscalYearId: string) => {
      if (!user?.id) throw new Error('No user');
      return setUserFiscalYear(user.id, fiscalYearId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-fiscal-year'] });
      toast.success('تم اختيار السنة المالية');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل اختيار السنة المالية');
    },
  });
}

export function useCloseFiscalYear() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (fiscalYearId: string) => {
      if (!companyId || !user?.id) throw new Error('Missing data');
      return closeFiscalYear(fiscalYearId, companyId, user.id);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        toast.success('تم إغلاق السنة المالية بنجاح');
      } else {
        toast.error(result.error || 'فشل إغلاق السنة المالية');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل إغلاق السنة المالية');
    },
  });
}

export function useOpenNewFiscalYear() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: (data: {
      name: string;
      startDate: string;
      endDate: string;
      previousYearId?: string;
      autoCarryForward?: boolean;
    }) => {
      if (!companyId) throw new Error('No company');
      return openNewFiscalYear(
        companyId,
        data.name,
        data.startDate,
        data.endDate,
        data.previousYearId,
        data.autoCarryForward
      );
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
        queryClient.invalidateQueries({ queryKey: ['current-fiscal-year'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        toast.success('تم فتح السنة المالية الجديدة بنجاح');
      } else {
        toast.error(result.error || 'فشل فتح السنة المالية');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل فتح السنة المالية');
    },
  });
}

export function useDeleteFiscalYear() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteFiscalYear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      toast.success('تم حذف السنة المالية');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل حذف السنة المالية');
    },
  });
}
