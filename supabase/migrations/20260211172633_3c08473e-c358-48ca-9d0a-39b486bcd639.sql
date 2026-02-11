
-- =============================================
-- 1. CHECKS / الشيكات والأوراق التجارية
-- =============================================
CREATE TABLE public.checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  check_number TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('received', 'issued')),
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT DEFAULT 'SAR',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  bank_name TEXT,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  drawer_name TEXT,
  payee_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deposited', 'collected', 'returned', 'cancelled', 'endorsed')),
  status_date DATE,
  customer_id UUID REFERENCES public.customers(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  account_id UUID REFERENCES public.account_categories(id),
  notes TEXT,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checks in their company" ON public.checks
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert checks in their company" ON public.checks
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update checks in their company" ON public.checks
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete checks in their company" ON public.checks
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_checks_company_id ON public.checks(company_id);
CREATE INDEX idx_checks_status ON public.checks(status);
CREATE INDEX idx_checks_due_date ON public.checks(due_date);

-- =============================================
-- 2. BUDGETS / الموازنات التقديرية
-- =============================================
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'closed')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.budget_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  account_id UUID NOT NULL REFERENCES public.account_categories(id),
  month_1 NUMERIC(18,2) DEFAULT 0,
  month_2 NUMERIC(18,2) DEFAULT 0,
  month_3 NUMERIC(18,2) DEFAULT 0,
  month_4 NUMERIC(18,2) DEFAULT 0,
  month_5 NUMERIC(18,2) DEFAULT 0,
  month_6 NUMERIC(18,2) DEFAULT 0,
  month_7 NUMERIC(18,2) DEFAULT 0,
  month_8 NUMERIC(18,2) DEFAULT 0,
  month_9 NUMERIC(18,2) DEFAULT 0,
  month_10 NUMERIC(18,2) DEFAULT 0,
  month_11 NUMERIC(18,2) DEFAULT 0,
  month_12 NUMERIC(18,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage budgets" ON public.budgets
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage budget lines" ON public.budget_lines
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_budgets_company ON public.budgets(company_id);
CREATE INDEX idx_budget_lines_budget ON public.budget_lines(budget_id);

-- =============================================
-- 3. DOCUMENT ATTACHMENTS / المرفقات
-- =============================================
CREATE TABLE public.document_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attachments" ON public.document_attachments
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_attachments_entity ON public.document_attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_company ON public.document_attachments(company_id);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

-- =============================================
-- 4. NOTIFICATIONS / الإشعارات والتنبيهات
-- =============================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger', 'success')),
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_company ON public.notifications(company_id);

-- =============================================
-- 5. APPROVAL WORKFLOWS / سير العمل والموافقات
-- =============================================
CREATE TABLE public.approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  min_amount NUMERIC(18,2) DEFAULT 0,
  max_amount NUMERIC(18,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.approval_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  approver_user_id UUID,
  approver_role TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_step INT DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE public.approval_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.approval_steps(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  acted_by UUID NOT NULL,
  acted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  comments TEXT
);

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workflows" ON public.approval_workflows
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage steps" ON public.approval_steps
  FOR ALL USING (workflow_id IN (SELECT id FROM public.approval_workflows WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage requests" ON public.approval_requests
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage actions" ON public.approval_actions
  FOR ALL USING (request_id IN (SELECT id FROM public.approval_requests WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())));

-- Add credit_limit to customers for credit limit alerts
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(18,2) DEFAULT 0;

-- Add due_date to sales for aging reports
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid';

-- Update trigger for checks
CREATE TRIGGER update_checks_updated_at BEFORE UPDATE ON public.checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_lines_updated_at BEFORE UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
