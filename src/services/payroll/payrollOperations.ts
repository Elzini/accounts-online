import { supabase } from '@/hooks/modules/useMiscServices';
import { JournalEngine } from '@/core/engine/journalEngine';
import { PayrollRecord, PayrollItem } from './types';
import { fetchEmployees, fetchPendingAdvances, updateAdvanceDeducted, mapPayrollItemWithSafeEmployee } from './employees';

function calculateProRataFactor(hireDate: string | null, payrollMonth: number, payrollYear: number): number {
  if (!hireDate) return 1;
  const hire = new Date(hireDate);
  const hireYear = hire.getFullYear();
  const hireMonth = hire.getMonth() + 1;
  if (hireYear < payrollYear || (hireYear === payrollYear && hireMonth < payrollMonth)) return 1;
  if (hireYear > payrollYear || (hireYear === payrollYear && hireMonth > payrollMonth)) return 0;
  const hireDay = hire.getDate();
  const daysInMonth = new Date(payrollYear, payrollMonth, 0).getDate();
  return Math.max(0, (daysInMonth - hireDay + 1) / daysInMonth);
}

function proRate(amount: number, factor: number): number {
  return Math.round(amount * factor);
}

function calculateAdvanceDeduction(advances: any[]): number {
  return advances.reduce((sum, a) => {
    const deduction = Number(a.monthly_deduction) > 0 
      ? Math.min(Number(a.monthly_deduction), Number(a.remaining_amount || a.amount))
      : Number(a.remaining_amount || a.amount);
    return sum + deduction;
  }, 0);
}

export async function fetchPayrollRecords(companyId: string, fiscalYear?: { start_date: string; end_date: string } | null): Promise<PayrollRecord[]> {
  let query = supabase.from('payroll_records').select('*').eq('company_id', companyId).order('year', { ascending: false }).order('month', { ascending: false });
  if (fiscalYear) {
    const startDate = new Date(fiscalYear.start_date);
    const endDate = new Date(fiscalYear.end_date);
    if (startDate.getFullYear() === endDate.getFullYear()) {
      query = query.eq('year', startDate.getFullYear()).gte('month', startDate.getMonth() + 1).lte('month', endDate.getMonth() + 1);
    } else {
      query = query.or(`and(year.eq.${startDate.getFullYear()},month.gte.${startDate.getMonth() + 1}),and(year.eq.${endDate.getFullYear()},month.lte.${endDate.getMonth() + 1})`);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PayrollRecord[];
}

export async function fetchPayrollWithItems(payrollId: string): Promise<PayrollRecord | null> {
  const { data: payroll, error: payrollError } = await supabase.from('payroll_records').select('*').eq('id', payrollId).single();
  if (payrollError) throw payrollError;
  if (!payroll) return null;
  const { data: items, error: itemsError } = await supabase.from('payroll_items').select('*, employee:employees_safe(*)').eq('payroll_id', payrollId).order('created_at', { ascending: true });
  if (itemsError) throw itemsError;
  return { ...payroll, items: (items || []).map(mapPayrollItemWithSafeEmployee) } as PayrollRecord;
}

export async function createPayrollRecord(companyId: string, month: number, year: number): Promise<PayrollRecord> {
  const { data, error } = await supabase.from('payroll_records').insert({ company_id: companyId, month, year, status: 'draft' }).select().single();
  if (error) throw error;
  return data as PayrollRecord;
}

export async function generatePayrollItems(payrollId: string, companyId: string): Promise<PayrollItem[]> {
  const { data: payrollRecord, error: prError } = await supabase.from('payroll_records').select('month, year').eq('id', payrollId).single();
  if (prError) throw prError;
  const { month: payrollMonth, year: payrollYear } = payrollRecord;

  const employees = await fetchEmployees(companyId);
  const activeEmployees = employees.filter(e => e.is_active);
  const pendingAdvances = await fetchPendingAdvances(companyId);

  const items: any[] = [];
  for (const emp of activeEmployees) {
    const factor = calculateProRataFactor(emp.hire_date, payrollMonth, payrollYear);
    if (factor === 0) continue;
    const totalAdvances = calculateAdvanceDeduction(pendingAdvances.filter(a => a.employee_id === emp.id));
    const proratedBase = proRate(Number(emp.base_salary), factor);
    const proratedHousing = proRate(Number(emp.housing_allowance), factor);
    const proratedTransport = proRate(Number(emp.transport_allowance), factor);
    const grossSalary = proratedBase + proratedHousing + proratedTransport;

    items.push({
      payroll_id: payrollId, employee_id: emp.id,
      base_salary: proratedBase, housing_allowance: proratedHousing, transport_allowance: proratedTransport,
      bonus: 0, gratuity: 0, overtime_hours: 0, overtime_rate: 0, overtime_amount: 0,
      advances_deducted: totalAdvances, absence_days: 0, absence_amount: 0, other_deductions: 0,
      deduction_notes: factor < 1 ? `راتب جزئي - تاريخ المباشرة: ${emp.hire_date}` : null,
      gross_salary: grossSalary, total_deductions: totalAdvances, net_salary: grossSalary - totalAdvances,
    });
  }

  const { data, error } = await supabase.from('payroll_items').insert(items).select('*, employee:employees_safe(*)');
  if (error) throw error;
  return (data || []).map(mapPayrollItemWithSafeEmployee);
}

export async function refreshPayrollAdvances(payrollId: string, companyId: string): Promise<void> {
  const { data: payrollRecord, error: prError } = await supabase.from('payroll_records').select('month, year').eq('id', payrollId).single();
  if (prError) throw prError;
  const { month: payrollMonth, year: payrollYear } = payrollRecord;

  const { data: items, error: itemsError } = await supabase.from('payroll_items').select('*, employee:employees_safe(*)').eq('payroll_id', payrollId);
  if (itemsError) throw itemsError;

  const pendingAdvances = await fetchPendingAdvances(companyId);
  const existingEmployeeIds = new Set<string>();

  if (items && items.length > 0) {
    for (const item of items) {
      existingEmployeeIds.add(item.employee_id);
      const employee = item.employee as Record<string, unknown> | null;
      if (employee && employee.is_active === false) { await supabase.from('payroll_items').delete().eq('id', item.id); continue; }

      const totalAdvances = calculateAdvanceDeduction(pendingAdvances.filter(a => a.employee_id === item.employee_id));
      if (totalAdvances !== Number(item.advances_deducted)) {
        const grossSalary = Number(item.base_salary) + Number(item.housing_allowance) + Number(item.transport_allowance) + Number(item.bonus || 0) + Number(item.gratuity || 0) + Number(item.overtime_amount || 0);
        const totalDeductions = totalAdvances + Number(item.absence_amount || 0) + Number(item.other_deductions || 0);
        await supabase.from('payroll_items').update({ advances_deducted: totalAdvances, total_deductions: totalDeductions, net_salary: grossSalary - totalDeductions }).eq('id', item.id);
      }
    }
  }

  const allEmployees = await fetchEmployees(companyId);
  const newEmployees = allEmployees.filter(e => e.is_active && !existingEmployeeIds.has(e.id));
  if (newEmployees.length > 0) {
    const newItems = newEmployees.map(emp => {
      const factor = calculateProRataFactor(emp.hire_date, payrollMonth, payrollYear);
      if (factor === 0) return null;
      const totalAdvances = calculateAdvanceDeduction(pendingAdvances.filter(a => a.employee_id === emp.id));
      const proratedBase = proRate(Number(emp.base_salary), factor);
      const proratedHousing = proRate(Number(emp.housing_allowance), factor);
      const proratedTransport = proRate(Number(emp.transport_allowance), factor);
      const grossSalary = proratedBase + proratedHousing + proratedTransport;
      return {
        payroll_id: payrollId, employee_id: emp.id,
        base_salary: proratedBase, housing_allowance: proratedHousing, transport_allowance: proratedTransport,
        bonus: 0, gratuity: 0, overtime_hours: 0, overtime_rate: 0, overtime_amount: 0,
        advances_deducted: totalAdvances, absence_days: 0, absence_amount: 0, other_deductions: 0,
        deduction_notes: factor < 1 ? `راتب جزئي - تاريخ المباشرة: ${emp.hire_date}` : null,
        gross_salary: grossSalary, total_deductions: totalAdvances, net_salary: grossSalary - totalAdvances,
      };
    }).filter(Boolean);
    if (newItems.length > 0) await supabase.from('payroll_items').insert(newItems);
  }
}

export async function updatePayrollItem(itemId: string, updates: Partial<PayrollItem>): Promise<PayrollItem> {
  const grossSalary = Number(updates.base_salary || 0) + Number(updates.housing_allowance || 0) + Number(updates.transport_allowance || 0) + Number(updates.bonus || 0) + Number(updates.gratuity || 0) + Number(updates.overtime_amount || 0);
  const totalDeductions = Number(updates.advances_deducted || 0) + Number(updates.absence_amount || 0) + Number(updates.other_deductions || 0);
  const { data, error } = await supabase.from('payroll_items').update({ ...updates, gross_salary: grossSalary, total_deductions: totalDeductions, net_salary: grossSalary - totalDeductions }).eq('id', itemId).select('*, employee:employees_safe(*)').single();
  if (error) throw error;
  return mapPayrollItemWithSafeEmployee(data as Record<string, unknown>);
}

export async function updatePayrollTotals(payrollId: string): Promise<PayrollRecord> {
  const { data: items, error: itemsError } = await supabase.from('payroll_items').select('*').eq('payroll_id', payrollId);
  if (itemsError) throw itemsError;

  const totals = (items || []).reduce((acc, item) => ({
    total_base_salaries: acc.total_base_salaries + Number(item.base_salary),
    total_allowances: acc.total_allowances + Number(item.housing_allowance) + Number(item.transport_allowance),
    total_bonuses: acc.total_bonuses + Number(item.bonus),
    total_gratuities: acc.total_gratuities + Number(item.gratuity || 0),
    total_overtime: acc.total_overtime + Number(item.overtime_amount),
    total_deductions: acc.total_deductions + Number(item.other_deductions),
    total_advances: acc.total_advances + Number(item.advances_deducted),
    total_absences: acc.total_absences + Number(item.absence_amount),
    total_net_salaries: acc.total_net_salaries + Number(item.net_salary),
  }), { total_base_salaries: 0, total_allowances: 0, total_bonuses: 0, total_gratuities: 0, total_overtime: 0, total_deductions: 0, total_advances: 0, total_absences: 0, total_net_salaries: 0 });

  const { data, error } = await supabase.from('payroll_records').update(totals).eq('id', payrollId).select().single();
  if (error) throw error;
  return data as PayrollRecord;
}

export async function approvePayroll(payrollId: string, userId: string, companyId: string, fiscalYearId?: string | null): Promise<{ payroll: PayrollRecord; journalEntryId: string }> {
  await updatePayrollTotals(payrollId);
  const updatedPayroll = await fetchPayrollWithItems(payrollId);
  if (!updatedPayroll) throw new Error('Payroll not found');

  const entryDescription = `مسير رواتب شهر ${updatedPayroll.month}/${updatedPayroll.year}`;
  // Use AccountResolver from Core Engine
  const { AccountResolver } = await import('@/core/engine/accountResolver');
  const resolver = new AccountResolver(companyId);
  await resolver.load();

  const cashRef = resolver.resolve('cash');
  const salaryAccount = resolver.resolveFlexible(null, null, '5201');
  const cashAccount = cashRef;
  const advancesAccount = resolver.resolveFlexible(null, null, '1204');
  if (!salaryAccount || !cashAccount) throw new Error('Salary or cash account not found');

  const lines: Array<{ account_id: string; description: string; debit: number; credit: number }> = [
    { account_id: salaryAccount.id, description: 'مصروف الرواتب', debit: updatedPayroll.total_net_salaries + updatedPayroll.total_advances, credit: 0 },
    { account_id: cashAccount.id, description: 'صرف الرواتب نقداً', debit: 0, credit: updatedPayroll.total_net_salaries },
  ];
  if (updatedPayroll.total_advances > 0 && advancesAccount) {
    lines.push({ account_id: advancesAccount.id, description: 'تسوية سلف الموظفين', debit: 0, credit: updatedPayroll.total_advances });
  }

  const journal = new JournalEngine(companyId);
  const journalEntry = await journal.createEntry({
    company_id: companyId,
    fiscal_year_id: fiscalYearId || '',
    entry_date: new Date().toISOString().split('T')[0],
    description: entryDescription,
    reference_type: 'manual',
    reference_id: payrollId,
    is_posted: true,
    lines,
  });

  if (updatedPayroll.items) {
    for (const item of updatedPayroll.items) {
      if (item.advances_deducted > 0) {
        const { data: advances } = await supabase.from('employee_advances').select('*').eq('employee_id', item.employee_id).eq('is_deducted', false);
        if (advances) {
          for (const advance of advances) {
            const deduction = Number(advance.monthly_deduction) > 0 ? Math.min(Number(advance.monthly_deduction), Number(advance.remaining_amount || advance.amount)) : Number(advance.remaining_amount || advance.amount);
            await updateAdvanceDeducted(advance.id, payrollId, deduction);
          }
        }
      }
    }
  }

  const { data: approvedPayroll, error: approveError } = await supabase.from('payroll_records').update({ status: 'approved', journal_entry_id: journalEntry.id, approved_by: userId, approved_at: new Date().toISOString() }).eq('id', payrollId).select().single();
  if (approveError) throw approveError;
  return { payroll: approvedPayroll as PayrollRecord, journalEntryId: journalEntry.id };
}

export async function deletePayroll(payrollId: string): Promise<void> {
  const { error } = await supabase.from('payroll_records').delete().eq('id', payrollId);
  if (error) throw error;
}
