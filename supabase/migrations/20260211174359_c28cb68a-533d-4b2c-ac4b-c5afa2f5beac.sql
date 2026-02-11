
-- ==========================================
-- HR Module: Attendance, Leaves, Insurance
-- ==========================================

-- Employee Attendance
CREATE TABLE public.employee_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'leave', 'holiday')),
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Employee Leaves
CREATE TABLE public.employee_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'emergency', 'maternity', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee Insurance (GOSI)
CREATE TABLE public.employee_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  insurance_type TEXT NOT NULL DEFAULT 'gosi' CHECK (insurance_type IN ('gosi', 'medical', 'life', 'other')),
  insurance_number TEXT,
  employee_contribution NUMERIC(18,2) DEFAULT 0,
  company_contribution NUMERIC(18,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee Bonuses/Deductions Log
CREATE TABLE public.employee_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bonus', 'deduction', 'advance', 'commission')),
  amount NUMERIC(18,2) NOT NULL,
  reason TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- Manufacturing Module
-- ==========================================

-- Products (Bill of Materials)
CREATE TABLE public.manufacturing_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  unit TEXT DEFAULT 'وحدة',
  estimated_cost NUMERIC(18,2) DEFAULT 0,
  selling_price NUMERIC(18,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BOM Lines (Raw materials for each product)
CREATE TABLE public.bom_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.manufacturing_products(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  quantity NUMERIC(18,4) NOT NULL,
  unit TEXT DEFAULT 'وحدة',
  unit_cost NUMERIC(18,2) DEFAULT 0,
  total_cost NUMERIC(18,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production Orders
CREATE TABLE public.production_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  order_number SERIAL,
  product_id UUID NOT NULL REFERENCES public.manufacturing_products(id),
  quantity NUMERIC(18,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  actual_cost NUMERIC(18,2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production Stages
CREATE TABLE public.production_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  labor_cost NUMERIC(18,2) DEFAULT 0,
  material_cost NUMERIC(18,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- Integrations Config
-- ==========================================
CREATE TABLE public.integration_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  platform TEXT NOT NULL CHECK (platform IN ('salla', 'zid', 'shopify', 'mada', 'apple_pay', 'bank_api', 'other')),
  is_active BOOLEAN DEFAULT false,
  config_data JSONB DEFAULT '{}',
  api_key_encrypted TEXT,
  webhook_url TEXT,
  last_sync_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, platform)
);

-- ==========================================
-- RLS Policies
-- ==========================================
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

-- Authenticated user policies
CREATE POLICY "Users can manage attendance" ON public.employee_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage leaves" ON public.employee_leaves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage insurance" ON public.employee_insurance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage rewards" ON public.employee_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage mfg products" ON public.manufacturing_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage bom" ON public.bom_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage production orders" ON public.production_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage production stages" ON public.production_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage integrations" ON public.integration_configs FOR ALL USING (true) WITH CHECK (true);
