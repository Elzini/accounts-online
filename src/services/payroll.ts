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
  monthly_deduction: number;
  remaining_amount: number;
  total_installments: number;
  deducted_installments: number;
  custody_id: string | null;
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

// Helper to map employees_safe view fields to Employee interface
function mapSafeEmployeeToEmployee(safeEmployee: Record<string, unknown>): Employee {
  return {
    ...safeEmployee,
    id_number: safeEmployee.id_number_masked as string | null,
    iban: safeEmployee.iban_masked as string | null,
  } as Employee;
}

// Helper to map advance with safe employee
function mapAdvanceWithSafeEmployee(advance: Record<string, unknown>): EmployeeAdvance {
  const employee = advance.employee as Record<string, unknown> | null;
  return {
    ...advance,
    employee: employee ? mapSafeEmployeeToEmployee(employee) : undefined,
  } as EmployeeAdvance;
}

// Helper to map payroll item with safe employee
function mapPayrollItemWithSafeEmployee(item: Record<string, unknown>): PayrollItem {
  const employee = item.employee as Record<string, unknown> | null;
  return {
    ...item,
    employee: employee ? mapSafeEmployeeToEmployee(employee) : undefined,
  } as PayrollItem;
}

// Use employees_safe view for read operations to mask sensitive PII (id_number, iban)
// The view shows only last 4 digits of identity documents for non-admin users
export async function fetchEmployees(companyId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees_safe')
    .select('*')
    .eq('company_id', companyId)
    .order('employee_number', { ascending: true });

  if (error) throw error;
  // Map the masked fields back to expected field names for UI compatibility
  return (data || []).map(employee => ({
    ...employee,
    phone: employee.phone_masked || null,
    id_number: null,
    bank_name: null,
    iban: employee.iban_masked,
    id_number_encrypted: null as string | null,
    iban_encrypted: null as string | null,
  })) as unknown as Employee[];
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
    .select('*, employee:employees_safe(*)')
    .eq('company_id', companyId)
    .order('advance_date', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapAdvanceWithSafeEmployee);
}

export async function fetchPendingAdvances(companyId: string): Promise<EmployeeAdvance[]> {
  const { data, error } = await supabase
    .from('employee_advances')
    .select('*, employee:employees_safe(*)')
    .eq('company_id', companyId)
    .eq('is_deducted', false)
    .order('advance_date', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapAdvanceWithSafeEmployee);
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

export async function updateAdvanceDeducted(advanceId: string, payrollId: string, deductionAmount?: number): Promise<void> {
  // Get current advance state
  const { data: advance, error: fetchError } = await supabase
    .from('employee_advances')
    .select('*')
    .eq('id', advanceId)
    .single();

  if (fetchError) throw fetchError;

  const remaining = Number(advance.remaining_amount || advance.amount) - (deductionAmount || Number(advance.amount));
  const newDeductedInstallments = (Number(advance.deducted_installments) || 0) + 1;
  const isFullyDeducted = remaining <= 0;

  const { error } = await supabase
    .from('employee_advances')
    .update({ 
      is_deducted: isFullyDeducted, 
      deducted_in_payroll_id: payrollId,
      remaining_amount: Math.max(0, remaining),
      deducted_installments: newDeductedInstallments,
    })
    .eq('id', advanceId);

  if (error) throw error;
}

// Payroll Records
export async function fetchPayrollRecords(
  companyId: string,
  fiscalYear?: { start_date: string; end_date: string } | null
): Promise<PayrollRecord[]> {
  let query = supabase
    .from('payroll_records')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  // Filter by fiscal year if provided
  if (fiscalYear) {
    const startDate = new Date(fiscalYear.start_date);
    const endDate = new Date(fiscalYear.end_date);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endMonth = endDate.getMonth() + 1;

    // Filter records that fall within the fiscal year range
    // We need to check if the payroll month/year falls within the fiscal year
    if (startYear === endYear) {
      // Same year fiscal year (e.g., Jan-Dec 2026)
      query = query
        .eq('year', startYear)
        .gte('month', startMonth)
        .lte('month', endMonth);
    } else {
      // Cross-year fiscal year (e.g., Jul 2025 - Jun 2026)
      query = query.or(
        `and(year.eq.${startYear},month.gte.${startMonth}),and(year.eq.${endYear},month.lte.${endMonth})`
      );
    }
  }

  const { data, error } = await query;

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
    .select('*, employee:employees_safe(*)')
    .eq('payroll_id', payrollId)
    .order('created_at', { ascending: true });

  if (itemsError) throw itemsError;

  return { ...payroll, items: (items || []).map(mapPayrollItemWithSafeEmployee) } as PayrollRecord;
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
    // Use monthly_deduction (installment) if available, otherwise use remaining_amount
    const totalAdvances = empAdvances.reduce((sum, a) => {
      const deduction = Number(a.monthly_deduction) > 0 
        ? Math.min(Number(a.monthly_deduction), Number(a.remaining_amount || a.amount))
        : Number(a.remaining_amount || a.amount);
      return sum + deduction;
    }, 0);

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
    .select('*, employee:employees_safe(*)');

  if (error) throw error;

  return (data || []).map(mapPayrollItemWithSafeEmployee);
}

// Refresh advances for all items in a payroll (re-calculate from pending advances)
export async function refreshPayrollAdvances(
  payrollId: string,
  companyId: string
): Promise<void> {
  const { data: items, error: itemsError } = await supabase
    .from('payroll_items')
    .select('*')
    .eq('payroll_id', payrollId);
  
  if (itemsError) throw itemsError;
  if (!items || items.length === 0) return;

  const pendingAdvances = await fetchPendingAdvances(companyId);

  for (const item of items) {
    const empAdvances = pendingAdvances.filter(a => a.employee_id === item.employee_id);
    const totalAdvances = empAdvances.reduce((sum, a) => {
      const deduction = Number(a.monthly_deduction) > 0 
        ? Math.min(Number(a.monthly_deduction), Number(a.remaining_amount || a.amount))
        : Number(a.remaining_amount || a.amount);
      return sum + deduction;
    }, 0);

    if (totalAdvances !== Number(item.advances_deducted)) {
      const grossSalary = Number(item.base_salary) + Number(item.housing_allowance) + Number(item.transport_allowance) + Number(item.bonus || 0) + Number(item.overtime_amount || 0);
      const totalDeductions = totalAdvances + Number(item.absence_amount || 0) + Number(item.other_deductions || 0);
      const netSalary = grossSalary - totalDeductions;

      await supabase
        .from('payroll_items')
        .update({
          advances_deducted: totalAdvances,
          total_deductions: totalDeductions,
          net_salary: netSalary,
        })
        .eq('id', item.id);
    }
  }
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
    .select('*, employee:employees_safe(*)')
    .single();

  if (error) throw error;
  return mapPayrollItemWithSafeEmployee(data as Record<string, unknown>);
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
  companyId: string,
  fiscalYearId?: string | null
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
  
  // Get salary expense account (5201), cash account (1101), and employee advances account (1204)
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('id, code')
    .eq('company_id', companyId)
    .in('code', ['5201', '1101', '1204']);

  const salaryAccount = accounts?.find(a => a.code === '5201');
  const cashAccount = accounts?.find(a => a.code === '1101');
  const advancesAccount = accounts?.find(a => a.code === '1204'); // سلف الموظفين - Employee Advances (Asset)

  if (!salaryAccount || !cashAccount) {
    throw new Error('Salary or cash account not found');
  }

  // Create journal entry with fiscal year
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
      fiscal_year_id: fiscalYearId || null,
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

  // Mark advances as deducted (with installment support)
  if (updatedPayroll.items) {
    for (const item of updatedPayroll.items) {
      if (item.advances_deducted > 0) {
        const { data: advances } = await supabase
          .from('employee_advances')
          .select('*')
          .eq('employee_id', item.employee_id)
          .eq('is_deducted', false);

        if (advances) {
          for (const advance of advances) {
            const deduction = Number(advance.monthly_deduction) > 0 
              ? Math.min(Number(advance.monthly_deduction), Number(advance.remaining_amount || advance.amount))
              : Number(advance.remaining_amount || advance.amount);
            await updateAdvanceDeducted(advance.id, payrollId, deduction);
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
