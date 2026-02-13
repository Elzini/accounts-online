import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from './useCompanyId';
import * as hrService from '@/services/hr';

export function useHREmployees() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['hr-employees', companyId],
    queryFn: () => hrService.fetchHREmployees(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateHREmployee() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: (emp: Partial<hrService.HREmployee> & { full_name: string }) =>
      hrService.createHREmployee({ ...emp, company_id: companyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-employees'] }),
  });
}

export function useUpdateHREmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<hrService.HREmployee> & { id: string }) =>
      hrService.updateHREmployee(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-employees'] }),
  });
}

export function useDeleteHREmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteHREmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-employees'] }),
  });
}

export function useHRInsurance() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['hr-insurance', companyId],
    queryFn: () => hrService.fetchHRInsurance(companyId!),
    enabled: !!companyId,
  });
}

export function useUpsertHRInsurance() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: (record: Partial<hrService.HRInsuranceRecord> & { employee_id: string }) =>
      hrService.upsertHRInsurance({ ...record, company_id: companyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-insurance'] }),
  });
}

export function useHREvaluations() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['hr-evaluations', companyId],
    queryFn: () => hrService.fetchHREvaluations(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateHREvaluation() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: (eval_: Partial<hrService.HREvaluation> & { employee_id: string }) =>
      hrService.createHREvaluation({ ...eval_, company_id: companyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-evaluations'] }),
  });
}

export function useHRTrainingCourses() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['hr-training', companyId],
    queryFn: () => hrService.fetchHRTrainingCourses(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateHRTrainingCourse() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: (course: Partial<hrService.HRTrainingCourse> & { name: string }) =>
      hrService.createHRTrainingCourse({ ...course, company_id: companyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-training'] }),
  });
}

export function useDeleteHRTrainingCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteHRTrainingCourse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-training'] }),
  });
}
