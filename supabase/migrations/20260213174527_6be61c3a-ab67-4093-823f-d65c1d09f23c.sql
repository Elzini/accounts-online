
-- =============================================
-- 1. Purchase Orders (أوامر الشراء)
-- =============================================
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  order_number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  total_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  fiscal_year_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_order_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage purchase orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage purchase order lines" ON public.purchase_order_lines FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 2. Goods Receipts (أذون الاستلام)
-- =============================================
CREATE TABLE public.goods_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  receipt_number TEXT NOT NULL,
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  received_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.goods_receipt_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goods_receipt_id UUID NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  ordered_qty NUMERIC DEFAULT 0,
  received_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage goods receipts" ON public.goods_receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage goods receipt lines" ON public.goods_receipt_lines FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 3. Stock Vouchers (أذون مخزنية)
-- =============================================
CREATE TABLE public.stock_vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  voucher_number TEXT NOT NULL,
  voucher_type TEXT NOT NULL DEFAULT 'issue',
  warehouse_id UUID,
  to_warehouse_id UUID,
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_voucher_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_voucher_id UUID NOT NULL REFERENCES public.stock_vouchers(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  unit_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_voucher_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage stock vouchers" ON public.stock_vouchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage stock voucher lines" ON public.stock_voucher_lines FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 4. Stocktaking (الجرد)
-- =============================================
CREATE TABLE public.stocktaking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  session_name TEXT NOT NULL,
  warehouse_id UUID,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.stocktaking_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.stocktaking_sessions(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  system_qty NUMERIC DEFAULT 0,
  actual_qty NUMERIC DEFAULT 0,
  difference NUMERIC GENERATED ALWAYS AS (actual_qty - system_qty) STORED,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stocktaking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocktaking_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage stocktaking" ON public.stocktaking_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage stocktaking lines" ON public.stocktaking_lines FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 5. Credit/Debit Notes (إشعارات دائنة/مدينة)
-- =============================================
CREATE TABLE public.credit_debit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  note_number TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'credit',
  related_invoice_id UUID,
  customer_id UUID,
  supplier_id UUID,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  fiscal_year_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_debit_note_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.credit_debit_notes(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_debit_note_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage credit debit notes" ON public.credit_debit_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage credit debit note lines" ON public.credit_debit_note_lines FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 6. CRM Leads (إدارة العملاء المحتملين)
-- =============================================
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  expected_value NUMERIC DEFAULT 0,
  assigned_to UUID,
  notes TEXT,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage crm leads" ON public.crm_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage crm activities" ON public.crm_activities FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 7. Loyalty (نقاط الولاء)
-- =============================================
CREATE TABLE public.loyalty_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  points_per_unit NUMERIC DEFAULT 1,
  unit_value NUMERIC DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  program_id UUID REFERENCES public.loyalty_programs(id),
  customer_id UUID,
  points NUMERIC NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL DEFAULT 'earn',
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage loyalty programs" ON public.loyalty_programs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage loyalty points" ON public.loyalty_points FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 8. Subscriptions (الاشتراكات)
-- =============================================
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  customer_id UUID,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_billing_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 9. Work Orders (أوامر العمل)
-- =============================================
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  customer_id UUID,
  assigned_to UUID,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  estimated_cost NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage work orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 10. Bookings (الحجوزات)
-- =============================================
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  service_type TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME,
  duration_minutes INT DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 11. Time Tracking (تتبع الوقت)
-- =============================================
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID,
  project_name TEXT,
  task_name TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  billable BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage time entries" ON public.time_entries FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 12. Employee Contracts (عقود الموظفين)
-- =============================================
CREATE TABLE public.employee_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID,
  employee_name TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'full-time',
  start_date DATE NOT NULL,
  end_date DATE,
  salary NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  position TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage employee contracts" ON public.employee_contracts FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 13. Departments / Org Structure (الهيكل التنظيمي)
-- =============================================
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.departments(id),
  manager_name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  department_id UUID REFERENCES public.departments(id),
  title TEXT NOT NULL,
  level TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage positions" ON public.positions FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 14. Rentals (الإيجارات)
-- =============================================
CREATE TABLE public.rental_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  unit_name TEXT NOT NULL,
  unit_type TEXT DEFAULT 'apartment',
  location TEXT,
  area NUMERIC,
  status TEXT NOT NULL DEFAULT 'available',
  monthly_rent NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rental_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  unit_id UUID REFERENCES public.rental_units(id),
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent NUMERIC NOT NULL DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage rental units" ON public.rental_units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage rental contracts" ON public.rental_contracts FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 15. Sales Targets (المبيعات المستهدفة)
-- =============================================
CREATE TABLE public.sales_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_name TEXT NOT NULL,
  employee_id UUID,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  achieved_amount NUMERIC DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage sales targets" ON public.sales_targets FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 16. Payment Transactions (بوابة الدفع)
-- =============================================
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  transaction_ref TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'SAR',
  payment_method TEXT NOT NULL DEFAULT 'card',
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT,
  customer_email TEXT,
  gateway TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage payment transactions" ON public.payment_transactions FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 17. Bookkeeping Clients (مسك الدفاتر)
-- =============================================
CREATE TABLE public.bookkeeping_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  client_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  tax_number TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_fee NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bookkeeping_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  client_id UUID REFERENCES public.bookkeeping_clients(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_type TEXT DEFAULT 'general',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookkeeping_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookkeeping_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage bookkeeping clients" ON public.bookkeeping_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage bookkeeping tasks" ON public.bookkeeping_tasks FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 18. ZATCA Sandbox Tests
-- =============================================
CREATE TABLE public.zatca_sandbox_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  test_name TEXT NOT NULL,
  invoice_type TEXT DEFAULT 'standard',
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  tested_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zatca_sandbox_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage zatca sandbox" ON public.zatca_sandbox_tests FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'purchase_orders','goods_receipts','stock_vouchers','stocktaking_sessions',
    'credit_debit_notes','crm_leads','loyalty_programs','subscriptions',
    'work_orders','bookings','time_entries','employee_contracts',
    'departments','rental_units','rental_contracts','sales_targets',
    'payment_transactions','bookkeeping_clients','bookkeeping_tasks'
  ])
  LOOP
    EXECUTE format('CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', replace(tbl, '-', '_'), tbl);
  END LOOP;
END $$;
