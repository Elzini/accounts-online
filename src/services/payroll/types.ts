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
  total_gratuities: number;
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
  gratuity: number;
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
