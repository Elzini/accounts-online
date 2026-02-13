import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
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
  refreshPayrollAdvances,
  Employee,
  EmployeeAdvance,
  PayrollItem,
} from '@/services/payroll';
import { fetchHREmployees, HREmployee } from '@/services/hr';

// Map HR employees to payroll Employee interface for backward compatibility
function mapHRToPayrollEmployee(hr: HREmployee): Employee {
  return {
    id: hr.id,
    company_id: hr.company_id,
    employee_number: parseInt(hr.employee_number || '0') || 0,
    name: hr.full_name,
    job_title: hr.job_title || '',
    base_salary: hr.base_salary,
    housing_allowance: hr.housing_allowance,
    transport_allowance: hr.transport_allowance,
    phone: hr.phone,
    id_number: hr.national_id,
    bank_name: hr.bank_name,
    iban: hr.iban,
    hire_date: hr.hire_date,
    is_active: hr.is_active,
    notes: hr.notes,
    created_at: hr.created_at,
    updated_at: hr.updated_at,
  };
}

// Employees - now reads from hr_employees for unified HR system
export function useEmployees() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['hr-employees', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const hrEmployees = await fetchHREmployees(companyId);
      return hrEmployees.map(mapHRToPayrollEmployee);
    },
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
  const { selectedFiscalYear } = useFiscalYear();

  return useQuery({
    queryKey: ['payroll-records', companyId, selectedFiscalYear?.id],
    queryFn: () => {
      if (!companyId) return [];
      return fetchPayrollRecords(companyId, selectedFiscalYear);
    },
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
  const { selectedFiscalYear } = useFiscalYear();

  return useMutation({
    mutationFn: (payrollId: string) => {
      if (!companyId || !user) throw new Error('Company ID and User required');
      return approvePayroll(payrollId, user.id, companyId, selectedFiscalYear?.id);
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

export function useRefreshPayrollAdvances() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (payrollId: string) => {
      if (!companyId) throw new Error('Company ID required');
      return refreshPayrollAdvances(payrollId, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records', companyId] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });
}
