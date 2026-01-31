import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  company_id: string;
  employee_number: number;
  name: string;
  job_title: string;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  phone: string | null;
  id_number: string | null;
  bank_name: string | null;
  iban: string | null;
  hire_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAdvance {
  id: string;
  company_id: string;
  employee_id: string;
  amount: number;
  advance_date: string;
  reason: string | null;
  is_deducted: boolean;
  deducted_in_payroll_id: string | null;
  notes: string | null;
  created_at: string;
  employee?: Employee;
}

export interface PayrollRecord {
  id: string;
  company_id: string;
  month: number;
  year: number;
  status: 'draft' | 'approved' | 'paid';
  total_base_salaries: number;
  total_allowances: number;
  total_bonuses: number;
  total_overtime: number;
  total_deductions: number;
  total_advances: number;
  total_absences: number;
  total_net_salaries: number;
  journal_entry_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  payroll_id: string;
  employee_id: string;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  bonus: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_amount: number;
  advances_deducted: number;
  absence_days: number;
  absence_amount: number;
  other_deductions: number;
  deduction_notes: string | null;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  created_at: string;
  employee?: Employee;
}

// Employees
export async function fetchEmployees(companyId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('employee_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addEmployee(employee: Omit<Employee, 'id' | 'employee_number' | 'created_at' | 'updated_at'>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Employee Advances
export async function fetchEmployeeAdvances(companyId: string, employeeId?: string): Promise<EmployeeAdvance[]> {
  let query = supabase
    .from('employee_advances')
    .select('*, employee:employees(*)')
    .eq('company_id', companyId)
    .order('advance_date', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchPendingAdvances(companyId: string): Promise<EmployeeAdvance[]> {
  const { data, error } = await supabase
    .from('employee_advances')
    .select('*, employee:employees(*)')
    .eq('company_id', companyId)
    .eq('is_deducted', false)
    .order('advance_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addEmployeeAdvance(advance: Omit<EmployeeAdvance, 'id' | 'created_at' | 'employee'>): Promise<EmployeeAdvance> {
  const { data, error } = await supabase
    .from('employee_advances')
    .insert(advance)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAdvanceDeducted(advanceId: string, payrollId: string): Promise<void> {
  const { error } = await supabase
    .from('employee_advances')
    .update({ is_deducted: true, deducted_in_payroll_id: payrollId })
    .eq('id', advanceId);

  if (error) throw error;
}

// Payroll Records
export async function fetchPayrollRecords(companyId: string): Promise<PayrollRecord[]> {
  const { data, error } = await supabase
    .from('payroll_records')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) throw error;
  return (data || []) as PayrollRecord[];
}

export async function fetchPayrollWithItems(payrollId: string): Promise<PayrollRecord | null> {
  const { data: payroll, error: payrollError } = await supabase
    .from('payroll_records')
    .select('*')
    .eq('id', payrollId)
    .single();

  if (payrollError) throw payrollError;
  if (!payroll) return null;

  const { data: items, error: itemsError } = await supabase
    .from('payroll_items')
    .select('*, employee:employees(*)')
    .eq('payroll_id', payrollId)
    .order('created_at', { ascending: true });

  if (itemsError) throw itemsError;

  return { ...payroll, items: items || [] } as PayrollRecord;
}

export async function createPayrollRecord(
  companyId: string,
  month: number,
  year: number
): Promise<PayrollRecord> {
  const { data, error } = await supabase
    .from('payroll_records')
    .insert({
      company_id: companyId,
      month,
      year,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return data as PayrollRecord;
}

export async function generatePayrollItems(
  payrollId: string,
  companyId: string
): Promise<PayrollItem[]> {
  // Get all active employees
  const employees = await fetchEmployees(companyId);
  const activeEmployees = employees.filter(e => e.is_active);

  // Get pending advances for each employee
  const pendingAdvances = await fetchPendingAdvances(companyId);

  const items: Omit<PayrollItem, 'id' | 'created_at' | 'employee'>[] = [];

  for (const emp of activeEmployees) {
    const empAdvances = pendingAdvances.filter(a => a.employee_id === emp.id);
    const totalAdvances = empAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

    const grossSalary = Number(emp.base_salary) + Number(emp.housing_allowance) + Number(emp.transport_allowance);
    const totalDeductions = totalAdvances;
    const netSalary = grossSalary - totalDeductions;

    items.push({
      payroll_id: payrollId,
      employee_id: emp.id,
      base_salary: Number(emp.base_salary),
      housing_allowance: Number(emp.housing_allowance),
      transport_allowance: Number(emp.transport_allowance),
      bonus: 0,
      overtime_hours: 0,
      overtime_rate: 0,
      overtime_amount: 0,
      advances_deducted: totalAdvances,
      absence_days: 0,
      absence_amount: 0,
      other_deductions: 0,
      deduction_notes: null,
      gross_salary: grossSalary,
      total_deductions: totalDeductions,
      net_salary: netSalary,
    });
  }

  // Insert all items
  const { data, error } = await supabase
    .from('payroll_items')
    .insert(items)
    .select('*, employee:employees(*)');

  if (error) throw error;

  return data || [];
}

export async function updatePayrollItem(
  itemId: string,
  updates: Partial<PayrollItem>
): Promise<PayrollItem> {
  // Calculate derived fields
  const grossSalary = 
    Number(updates.base_salary || 0) + 
    Number(updates.housing_allowance || 0) + 
    Number(updates.transport_allowance || 0) + 
    Number(updates.bonus || 0) + 
    Number(updates.overtime_amount || 0);

  const totalDeductions = 
    Number(updates.advances_deducted || 0) + 
    Number(updates.absence_amount || 0) + 
    Number(updates.other_deductions || 0);

  const netSalary = grossSalary - totalDeductions;

  const { data, error } = await supabase
    .from('payroll_items')
    .update({
      ...updates,
      gross_salary: grossSalary,
      total_deductions: totalDeductions,
      net_salary: netSalary,
    })
    .eq('id', itemId)
    .select('*, employee:employees(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function updatePayrollTotals(payrollId: string): Promise<PayrollRecord> {
  // Get all items for this payroll
  const { data: items, error: itemsError } = await supabase
    .from('payroll_items')
    .select('*')
    .eq('payroll_id', payrollId);

  if (itemsError) throw itemsError;

  const totals = (items || []).reduce(
    (acc, item) => ({
      total_base_salaries: acc.total_base_salaries + Number(item.base_salary),
      total_allowances: acc.total_allowances + Number(item.housing_allowance) + Number(item.transport_allowance),
      total_bonuses: acc.total_bonuses + Number(item.bonus),
      total_overtime: acc.total_overtime + Number(item.overtime_amount),
      total_deductions: acc.total_deductions + Number(item.other_deductions),
      total_advances: acc.total_advances + Number(item.advances_deducted),
      total_absences: acc.total_absences + Number(item.absence_amount),
      total_net_salaries: acc.total_net_salaries + Number(item.net_salary),
    }),
    {
      total_base_salaries: 0,
      total_allowances: 0,
      total_bonuses: 0,
      total_overtime: 0,
      total_deductions: 0,
      total_advances: 0,
      total_absences: 0,
      total_net_salaries: 0,
    }
  );

  const { data, error } = await supabase
    .from('payroll_records')
    .update(totals)
    .eq('id', payrollId)
    .select()
    .single();

  if (error) throw error;
  return data as PayrollRecord;
}

export async function approvePayroll(
  payrollId: string,
  userId: string,
  companyId: string
): Promise<{ payroll: PayrollRecord; journalEntryId: string }> {
  // Get payroll with items
  const payroll = await fetchPayrollWithItems(payrollId);
  if (!payroll) throw new Error('Payroll not found');

  // Update totals first
  await updatePayrollTotals(payrollId);

  // Get updated payroll
  const updatedPayroll = await fetchPayrollWithItems(payrollId);
  if (!updatedPayroll) throw new Error('Payroll not found');

  // Create journal entry for salaries
  const entryDescription = `مسير رواتب شهر ${updatedPayroll.month}/${updatedPayroll.year}`;
  
  // Get salary expense account (5201) and cash account (1101)
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('id, code')
    .eq('company_id', companyId)
    .in('code', ['5201', '1101', '2101']);

  const salaryAccount = accounts?.find(a => a.code === '5201');
  const cashAccount = accounts?.find(a => a.code === '1101');
  const advancesAccount = accounts?.find(a => a.code === '2101'); // Advances receivable

  if (!salaryAccount || !cashAccount) {
    throw new Error('Salary or cash account not found');
  }

  // Create journal entry
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      description: entryDescription,
      entry_date: new Date().toISOString().split('T')[0],
      reference_type: 'payroll',
      reference_id: payrollId,
      total_debit: updatedPayroll.total_net_salaries + updatedPayroll.total_advances,
      total_credit: updatedPayroll.total_net_salaries + updatedPayroll.total_advances,
      is_posted: true,
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Create journal entry lines
  const lines = [
    // Debit: Salary expense (total gross)
    {
      journal_entry_id: journalEntry.id,
      account_id: salaryAccount.id,
      description: 'مصروف الرواتب',
      debit: updatedPayroll.total_net_salaries + updatedPayroll.total_advances,
      credit: 0,
    },
    // Credit: Cash (net paid)
    {
      journal_entry_id: journalEntry.id,
      account_id: cashAccount.id,
      description: 'صرف الرواتب نقداً',
      debit: 0,
      credit: updatedPayroll.total_net_salaries,
    },
  ];

  // If there are advances deducted, credit the advances account
  if (updatedPayroll.total_advances > 0 && advancesAccount) {
    lines.push({
      journal_entry_id: journalEntry.id,
      account_id: advancesAccount.id,
      description: 'تسوية سلف الموظفين',
      debit: 0,
      credit: updatedPayroll.total_advances,
    });
  }

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(lines);

  if (linesError) throw linesError;

  // Mark advances as deducted
  if (updatedPayroll.items) {
    for (const item of updatedPayroll.items) {
      if (item.advances_deducted > 0) {
        const { data: advances } = await supabase
          .from('employee_advances')
          .select('id')
          .eq('employee_id', item.employee_id)
          .eq('is_deducted', false);

        if (advances) {
          for (const advance of advances) {
            await updateAdvanceDeducted(advance.id, payrollId);
          }
        }
      }
    }
  }

  // Update payroll status
  const { data: approvedPayroll, error: approveError } = await supabase
    .from('payroll_records')
    .update({
      status: 'approved',
      journal_entry_id: journalEntry.id,
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', payrollId)
    .select()
    .single();

  if (approveError) throw approveError;

  return { payroll: approvedPayroll as PayrollRecord, journalEntryId: journalEntry.id };
}

export async function deletePayroll(payrollId: string): Promise<void> {
  const { error } = await supabase
    .from('payroll_records')
    .delete()
    .eq('id', payrollId);

  if (error) throw error;
}
