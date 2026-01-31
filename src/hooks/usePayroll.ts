import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  fetchEmployeeAdvances,
  fetchPendingAdvances,
  addEmployeeAdvance,
  fetchPayrollRecords,
  fetchPayrollWithItems,
  createPayrollRecord,
  generatePayrollItems,
  updatePayrollItem,
  updatePayrollTotals,
  approvePayroll,
  deletePayroll,
  Employee,
  EmployeeAdvance,
  PayrollItem,
} from '@/services/payroll';

// Employees
export function useEmployees() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['employees', companyId],
    queryFn: () => (companyId ? fetchEmployees(companyId) : []),
    enabled: !!companyId,
  });
}

export function useAddEmployee() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (employee: Omit<Employee, 'id' | 'employee_number' | 'created_at' | 'updated_at' | 'company_id'>) => {
      if (!companyId) throw new Error('Company ID required');
      return addEmployee({ ...employee, company_id: companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', companyId] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Employee> }) => {
      return updateEmployee(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', companyId] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', companyId] });
    },
  });
}

// Employee Advances
export function useEmployeeAdvances(employeeId?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['employee-advances', companyId, employeeId],
    queryFn: () => (companyId ? fetchEmployeeAdvances(companyId, employeeId) : []),
    enabled: !!companyId,
  });
}

export function usePendingAdvances() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['pending-advances', companyId],
    queryFn: () => (companyId ? fetchPendingAdvances(companyId) : []),
    enabled: !!companyId,
  });
}

export function useAddEmployeeAdvance() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (advance: Omit<EmployeeAdvance, 'id' | 'created_at' | 'employee' | 'company_id'>) => {
      if (!companyId) throw new Error('Company ID required');
      return addEmployeeAdvance({ ...advance, company_id: companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-advances', companyId] });
      queryClient.invalidateQueries({ queryKey: ['pending-advances', companyId] });
    },
  });
}

// Payroll Records
export function usePayrollRecords() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['payroll-records', companyId],
    queryFn: () => (companyId ? fetchPayrollRecords(companyId) : []),
    enabled: !!companyId,
  });
}

export function usePayrollWithItems(payrollId: string | null) {
  return useQuery({
    queryKey: ['payroll', payrollId],
    queryFn: () => (payrollId ? fetchPayrollWithItems(payrollId) : null),
    enabled: !!payrollId,
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (!companyId) throw new Error('Company ID required');
      const payroll = await createPayrollRecord(companyId, month, year);
      await generatePayrollItems(payroll.id, companyId);
      return payroll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records', companyId] });
    },
  });
}

export function useUpdatePayrollItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<PayrollItem> }) => {
      return updatePayrollItem(itemId, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll', data.payroll_id] });
    },
  });
}

export function useUpdatePayrollTotals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePayrollTotals,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll', data.id] });
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
    },
  });
}

export function useApprovePayroll() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payrollId: string) => {
      if (!companyId || !user) throw new Error('Company ID and User required');
      return approvePayroll(payrollId, user.id, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records', companyId] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['pending-advances', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
    },
  });
}

export function useDeletePayroll() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: deletePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records', companyId] });
    },
  });
}
