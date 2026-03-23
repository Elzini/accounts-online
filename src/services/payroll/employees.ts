import { supabase } from '@/hooks/modules/useMiscServices';
import { Employee, EmployeeAdvance } from './types';

// Helper mappers for safe views
export function mapSafeEmployeeToEmployee(safeEmployee: Record<string, unknown>): Employee {
  return { ...safeEmployee, id_number: safeEmployee.id_number_masked as string | null, iban: safeEmployee.iban_masked as string | null } as Employee;
}

export function mapAdvanceWithSafeEmployee(advance: Record<string, unknown>): EmployeeAdvance {
  const employee = advance.employee as Record<string, unknown> | null;
  return { ...advance, employee: employee ? mapSafeEmployeeToEmployee(employee) : undefined } as EmployeeAdvance;
}

export function mapPayrollItemWithSafeEmployee(item: Record<string, unknown>): any {
  const employee = item.employee as Record<string, unknown> | null;
  return { ...item, employee: employee ? mapSafeEmployeeToEmployee(employee) : undefined };
}

export async function fetchEmployees(companyId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees_safe')
    .select('*')
    .eq('company_id', companyId)
    .order('employee_number', { ascending: true });
  if (error) throw error;
  return (data || []).map(employee => ({
    ...employee, phone: employee.phone_masked || null,
    id_number: null, bank_name: null, iban: employee.iban_masked,
    id_number_encrypted: null as string | null, iban_encrypted: null as string | null,
  })) as unknown as Employee[];
}

export async function addEmployee(employee: Omit<Employee, 'id' | 'employee_number' | 'created_at' | 'updated_at'>): Promise<Employee> {
  const { data, error } = await supabase.from('employees').insert(employee).select().single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchEmployeeAdvances(companyId: string, employeeId?: string): Promise<EmployeeAdvance[]> {
  let query = supabase.from('employee_advances').select('*, employee:employees_safe(*)').eq('company_id', companyId).order('advance_date', { ascending: false });
  if (employeeId) query = query.eq('employee_id', employeeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapAdvanceWithSafeEmployee);
}

export async function fetchPendingAdvances(companyId: string): Promise<EmployeeAdvance[]> {
  const { data, error } = await supabase.from('employee_advances').select('*, employee:employees_safe(*)').eq('company_id', companyId).eq('is_deducted', false).order('advance_date', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapAdvanceWithSafeEmployee);
}

export async function addEmployeeAdvance(advance: Omit<EmployeeAdvance, 'id' | 'created_at' | 'employee'>): Promise<EmployeeAdvance> {
  const { data, error } = await supabase.from('employee_advances').insert(advance).select().single();
  if (error) throw error;
  return data;
}

export async function updateAdvanceDeducted(advanceId: string, payrollId: string, deductionAmount?: number): Promise<void> {
  const { data: advance, error: fetchError } = await supabase.from('employee_advances').select('*').eq('id', advanceId).single();
  if (fetchError) throw fetchError;

  const remaining = Number(advance.remaining_amount || advance.amount) - (deductionAmount || Number(advance.amount));
  const newDeductedInstallments = (Number(advance.deducted_installments) || 0) + 1;
  const isFullyDeducted = remaining <= 0;

  const { error } = await supabase.from('employee_advances').update({ 
    is_deducted: isFullyDeducted, deducted_in_payroll_id: payrollId,
    remaining_amount: Math.max(0, remaining), deducted_installments: newDeductedInstallments,
  }).eq('id', advanceId);
  if (error) throw error;
}
