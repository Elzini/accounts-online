
-- =============================================
-- Real Estate Development Module - Phase 1
-- =============================================

-- 1. Real Estate Projects (المشاريع العقارية)
CREATE TABLE public.re_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  location TEXT,
  city TEXT,
  district TEXT,
  land_area NUMERIC,
  total_built_area NUMERIC,
  total_units INTEGER DEFAULT 0,
  project_type TEXT DEFAULT 'residential', -- residential, commercial, mixed, land_subdivision
  status TEXT DEFAULT 'planning', -- planning, under_construction, completed, on_hold, cancelled
  progress_percentage NUMERIC DEFAULT 0,
  start_date DATE,
  expected_completion DATE,
  actual_completion DATE,
  total_budget NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  land_cost NUMERIC DEFAULT 0,
  construction_cost NUMERIC DEFAULT 0,
  manager_name TEXT,
  license_number TEXT,
  wafi_number TEXT,
  escrow_account TEXT,
  image_url TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Project Phases (مراحل المشروع)
CREATE TABLE public.re_project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.re_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase_order INTEGER DEFAULT 1,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  progress_percentage NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  weight_percentage NUMERIC DEFAULT 0, -- وزن المرحلة من إجمالي المشروع
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Real Estate Units (الوحدات العقارية)
CREATE TABLE public.re_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.re_projects(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  unit_type TEXT DEFAULT 'apartment', -- apartment, villa, duplex, studio, shop, office, land
  floor_number INTEGER,
  building_number TEXT,
  area NUMERIC, -- مساحة بالمتر المربع
  rooms INTEGER,
  bathrooms INTEGER,
  price NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'available', -- available, reserved, sold, rented, under_construction
  customer_id UUID REFERENCES public.customers(id),
  reservation_date DATE,
  reservation_amount NUMERIC DEFAULT 0,
  sale_date DATE,
  sale_price NUMERIC DEFAULT 0,
  payment_plan TEXT, -- cash, installments, bank_finance
  contract_number TEXT,
  deed_number TEXT,
  sakani_eligible BOOLEAN DEFAULT false, -- مؤهل لدعم سكني
  rett_paid BOOLEAN DEFAULT false, -- هل تم دفع ضريبة التصرفات العقارية
  rett_amount NUMERIC DEFAULT 0,
  notes TEXT,
  features JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Unit Installments (أقساط الوحدات)
CREATE TABLE public.re_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.re_units(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue, partially_paid
  payment_method TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Contractors (المقاولين)
CREATE TABLE public.re_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  specialty TEXT, -- general, electrical, plumbing, hvac, finishing, landscaping
  license_number TEXT,
  tax_number TEXT,
  bank_name TEXT,
  iban TEXT,
  rating INTEGER, -- 1-5
  is_active BOOLEAN DEFAULT true,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Work Orders (أوامر العمل)
CREATE TABLE public.re_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.re_projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.re_contractors(id),
  phase_id UUID REFERENCES public.re_project_phases(id),
  order_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  work_type TEXT,
  contract_amount NUMERIC DEFAULT 0,
  retention_percentage NUMERIC DEFAULT 10, -- نسبة المحجوز (عادة 10%)
  retention_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, approved, in_progress, completed, cancelled
  start_date DATE,
  end_date DATE,
  actual_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Progress Billings / المستخلصات
CREATE TABLE public.re_progress_billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.re_work_orders(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.re_projects(id),
  contractor_id UUID NOT NULL REFERENCES public.re_contractors(id),
  billing_number TEXT,
  billing_date DATE DEFAULT CURRENT_DATE,
  period_from DATE,
  period_to DATE,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  retention_amount NUMERIC DEFAULT 0,
  previous_payments NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  vat_amount NUMERIC DEFAULT 0,
  total_with_vat NUMERIC DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, submitted, approved, paid, rejected
  approved_by TEXT,
  approved_date DATE,
  payment_date DATE,
  journal_entry_id UUID,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.re_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_progress_billings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - company scoped
CREATE POLICY "Users can manage their company re_projects" ON public.re_projects FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their company re_project_phases" ON public.re_project_phases FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their company re_units" ON public.re_units FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their company re_installments" ON public.re_installments FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their company re_contractors" ON public.re_contractors FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their company re_work_orders" ON public.re_work_orders FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their company re_progress_billings" ON public.re_progress_billings FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_re_projects_company ON public.re_projects(company_id);
CREATE INDEX idx_re_units_project ON public.re_units(project_id);
CREATE INDEX idx_re_units_status ON public.re_units(status);
CREATE INDEX idx_re_installments_unit ON public.re_installments(unit_id);
CREATE INDEX idx_re_installments_status ON public.re_installments(status);
CREATE INDEX idx_re_work_orders_project ON public.re_work_orders(project_id);
CREATE INDEX idx_re_progress_billings_work_order ON public.re_progress_billings(work_order_id);
