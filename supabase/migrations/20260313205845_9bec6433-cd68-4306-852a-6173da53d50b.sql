
-- =================== CRM: Leads ===================
CREATE TABLE public.re_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT DEFAULT 'walk_in',
  status TEXT DEFAULT 'new',
  interest_project_id UUID REFERENCES public.re_projects(id) ON DELETE SET NULL,
  interest_unit_type TEXT,
  budget_min NUMERIC DEFAULT 0,
  budget_max NUMERIC DEFAULT 0,
  assigned_to TEXT,
  notes TEXT,
  converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.re_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "re_leads_select" ON public.re_leads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_leads.company_id));
CREATE POLICY "re_leads_insert" ON public.re_leads FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_leads.company_id));
CREATE POLICY "re_leads_update" ON public.re_leads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_leads.company_id));
CREATE POLICY "re_leads_delete" ON public.re_leads FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_leads.company_id));

CREATE INDEX idx_re_leads_company ON public.re_leads(company_id);
CREATE INDEX idx_re_leads_status ON public.re_leads(status);

-- =================== CRM: Follow-ups ===================
CREATE TABLE public.re_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.re_leads(id) ON DELETE CASCADE,
  follow_up_date TIMESTAMPTZ NOT NULL,
  follow_up_type TEXT DEFAULT 'call',
  notes TEXT,
  outcome TEXT,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.re_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "re_follow_ups_select" ON public.re_follow_ups FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_follow_ups.company_id));
CREATE POLICY "re_follow_ups_insert" ON public.re_follow_ups FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_follow_ups.company_id));
CREATE POLICY "re_follow_ups_update" ON public.re_follow_ups FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_follow_ups.company_id));
CREATE POLICY "re_follow_ups_delete" ON public.re_follow_ups FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_follow_ups.company_id));

CREATE INDEX idx_re_follow_ups_lead ON public.re_follow_ups(lead_id);

-- =================== After-Sales: Maintenance Requests ===================
CREATE TABLE public.re_maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.re_units(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  request_number TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  description TEXT NOT NULL,
  resolution TEXT,
  assigned_to TEXT,
  warranty_covered BOOLEAN DEFAULT false,
  estimated_cost NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  requested_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.re_maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "re_maintenance_select" ON public.re_maintenance_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_maintenance_requests.company_id));
CREATE POLICY "re_maintenance_insert" ON public.re_maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_maintenance_requests.company_id));
CREATE POLICY "re_maintenance_update" ON public.re_maintenance_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_maintenance_requests.company_id));
CREATE POLICY "re_maintenance_delete" ON public.re_maintenance_requests FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = re_maintenance_requests.company_id));

CREATE INDEX idx_re_maintenance_unit ON public.re_maintenance_requests(unit_id);
CREATE INDEX idx_re_maintenance_company ON public.re_maintenance_requests(company_id);
