-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_number SERIAL,
  name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  housing_allowance NUMERIC NOT NULL DEFAULT 0,
  transport_allowance NUMERIC NOT NULL DEFAULT 0,
  phone TEXT,
  id_number TEXT,
  bank_name TEXT,
  iban TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee advances (سلف) table
CREATE TABLE public.employee_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  is_deducted BOOLEAN NOT NULL DEFAULT false,
  deducted_in_payroll_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll records table (مسير الرواتب)
CREATE TABLE public.payroll_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  total_base_salaries NUMERIC NOT NULL DEFAULT 0,
  total_allowances NUMERIC NOT NULL DEFAULT 0,
  total_bonuses NUMERIC NOT NULL DEFAULT 0,
  total_overtime NUMERIC NOT NULL DEFAULT 0,
  total_deductions NUMERIC NOT NULL DEFAULT 0,
  total_advances NUMERIC NOT NULL DEFAULT 0,
  total_absences NUMERIC NOT NULL DEFAULT 0,
  total_net_salaries NUMERIC NOT NULL DEFAULT 0,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, month, year)
);

-- Create payroll items table (تفاصيل رواتب الموظفين)
CREATE TABLE public.payroll_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id UUID NOT NULL REFERENCES public.payroll_records(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  housing_allowance NUMERIC NOT NULL DEFAULT 0,
  transport_allowance NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC NOT NULL DEFAULT 0,
  overtime_hours NUMERIC NOT NULL DEFAULT 0,
  overtime_rate NUMERIC NOT NULL DEFAULT 0,
  overtime_amount NUMERIC NOT NULL DEFAULT 0,
  advances_deducted NUMERIC NOT NULL DEFAULT 0,
  absence_days NUMERIC NOT NULL DEFAULT 0,
  absence_amount NUMERIC NOT NULL DEFAULT 0,
  other_deductions NUMERIC NOT NULL DEFAULT 0,
  deduction_notes TEXT,
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  total_deductions NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Users can view employees in their company"
ON public.employees FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert employees in their company"
ON public.employees FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update employees in their company"
ON public.employees FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete employees in their company"
ON public.employees FOR DELETE
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

-- RLS Policies for employee_advances
CREATE POLICY "Users can view advances in their company"
ON public.employee_advances FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert advances in their company"
ON public.employee_advances FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update advances in their company"
ON public.employee_advances FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete advances in their company"
ON public.employee_advances FOR DELETE
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

-- RLS Policies for payroll_records
CREATE POLICY "Users can view payroll in their company"
ON public.payroll_records FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert payroll in their company"
ON public.payroll_records FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update payroll in their company"
ON public.payroll_records FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete payroll in their company"
ON public.payroll_records FOR DELETE
USING (company_id IN (
  SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
));

-- RLS Policies for payroll_items
CREATE POLICY "Users can view payroll items via payroll"
ON public.payroll_items FOR SELECT
USING (payroll_id IN (
  SELECT id FROM public.payroll_records WHERE company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can insert payroll items via payroll"
ON public.payroll_items FOR INSERT
WITH CHECK (payroll_id IN (
  SELECT id FROM public.payroll_records WHERE company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can update payroll items via payroll"
ON public.payroll_items FOR UPDATE
USING (payroll_id IN (
  SELECT id FROM public.payroll_records WHERE company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can delete payroll items via payroll"
ON public.payroll_items FOR DELETE
USING (payroll_id IN (
  SELECT id FROM public.payroll_records WHERE company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  )
));

-- Create trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
BEFORE UPDATE ON public.payroll_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();