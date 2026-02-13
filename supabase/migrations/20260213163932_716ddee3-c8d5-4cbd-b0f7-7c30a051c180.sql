
-- =============================================
-- HR MODULE + ZATCA: Complete Database Schema
-- =============================================

-- 1. HR Employees table
CREATE TABLE public.hr_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_number TEXT,
  full_name TEXT NOT NULL,
  full_name_en TEXT,
  national_id TEXT,
  phone TEXT,
  email TEXT,
  department TEXT,
  job_title TEXT,
  hire_date DATE,
  contract_type TEXT DEFAULT 'full-time',
  base_salary NUMERIC(12,2) DEFAULT 0,
  housing_allowance NUMERIC(12,2) DEFAULT 0,
  transport_allowance NUMERIC(12,2) DEFAULT 0,
  other_allowances NUMERIC(12,2) DEFAULT 0,
  bank_name TEXT,
  iban TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_employees_select" ON public.hr_employees FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_employees_insert" ON public.hr_employees FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_employees_update" ON public.hr_employees FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_employees_delete" ON public.hr_employees FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 2. HR Insurance Records (GOSI)
CREATE TABLE public.hr_insurance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  gosi_number TEXT,
  registration_date DATE,
  contribution_rate NUMERIC(5,2) DEFAULT 9.75,
  employer_share NUMERIC(5,2) DEFAULT 11.75,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_insurance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_insurance_select" ON public.hr_insurance_records FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_insurance_insert" ON public.hr_insurance_records FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_insurance_update" ON public.hr_insurance_records FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_insurance_delete" ON public.hr_insurance_records FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 3. HR Performance Evaluations
CREATE TABLE public.hr_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  evaluation_period TEXT,
  evaluator_name TEXT,
  overall_score NUMERIC(3,1) DEFAULT 0,
  criteria JSONB DEFAULT '[]',
  strengths TEXT,
  weaknesses TEXT,
  goals TEXT,
  status TEXT DEFAULT 'draft',
  evaluation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_evaluations_select" ON public.hr_evaluations FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_evaluations_insert" ON public.hr_evaluations FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_evaluations_update" ON public.hr_evaluations FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_evaluations_delete" ON public.hr_evaluations FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 4. HR Training Courses
CREATE TABLE public.hr_training_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  provider TEXT,
  course_date DATE,
  duration_hours INTEGER DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  location TEXT,
  max_attendees INTEGER,
  status TEXT DEFAULT 'upcoming',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_training_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_training_courses_select" ON public.hr_training_courses FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_training_courses_insert" ON public.hr_training_courses FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_training_courses_update" ON public.hr_training_courses FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_training_courses_delete" ON public.hr_training_courses FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 5. Training Attendees
CREATE TABLE public.hr_training_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.hr_training_courses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  attendance_status TEXT DEFAULT 'registered',
  certificate_issued BOOLEAN DEFAULT false,
  score NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, employee_id)
);

ALTER TABLE public.hr_training_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_training_attendees_select" ON public.hr_training_attendees FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_training_attendees_insert" ON public.hr_training_attendees FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_training_attendees_update" ON public.hr_training_attendees FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "hr_training_attendees_delete" ON public.hr_training_attendees FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 6. ZATCA Configuration table
CREATE TABLE public.zatca_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE,
  environment TEXT DEFAULT 'sandbox',
  otp TEXT,
  compliance_csid TEXT,
  production_csid TEXT,
  private_key TEXT,
  certificate TEXT,
  api_base_url TEXT DEFAULT 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal',
  last_sync_at TIMESTAMPTZ,
  status TEXT DEFAULT 'not_configured',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zatca_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zatca_config_select" ON public.zatca_config FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "zatca_config_insert" ON public.zatca_config FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "zatca_config_update" ON public.zatca_config FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 7. ZATCA Submitted Invoices log
CREATE TABLE public.zatca_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  invoice_id TEXT,
  invoice_type TEXT DEFAULT 'standard',
  invoice_hash TEXT,
  uuid TEXT,
  xml_content TEXT,
  qr_code TEXT,
  submission_status TEXT DEFAULT 'pending',
  zatca_response JSONB,
  clearance_status TEXT,
  reporting_status TEXT,
  warning_messages JSONB,
  error_messages JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zatca_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zatca_invoices_select" ON public.zatca_invoices FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "zatca_invoices_insert" ON public.zatca_invoices FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "zatca_invoices_update" ON public.zatca_invoices FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers
CREATE TRIGGER update_hr_employees_updated_at BEFORE UPDATE ON public.hr_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hr_insurance_updated_at BEFORE UPDATE ON public.hr_insurance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hr_evaluations_updated_at BEFORE UPDATE ON public.hr_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hr_training_courses_updated_at BEFORE UPDATE ON public.hr_training_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zatca_config_updated_at BEFORE UPDATE ON public.zatca_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
