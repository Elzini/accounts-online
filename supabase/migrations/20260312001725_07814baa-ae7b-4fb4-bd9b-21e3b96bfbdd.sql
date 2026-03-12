
-- جدول أكواد التحقق للعمليات الحساسة
CREATE TABLE public.critical_operation_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  operation_type TEXT NOT NULL,
  operation_description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  otp_code TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_critical_otps_company ON public.critical_operation_otps(company_id);
CREATE INDEX idx_critical_otps_code ON public.critical_operation_otps(otp_code, company_id);

ALTER TABLE public.critical_operation_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "otp_insert" ON public.critical_operation_otps FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND company_id = critical_operation_otps.company_id));

CREATE POLICY "otp_select" ON public.critical_operation_otps FOR SELECT TO authenticated
USING (requested_by = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'admin'));

CREATE POLICY "otp_update" ON public.critical_operation_otps FOR UPDATE TO authenticated
USING (requested_by = auth.uid() AND is_used = false);

-- جدول نتائج فحص سلامة البيانات
CREATE TABLE public.data_integrity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  check_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB,
  issues_found INTEGER DEFAULT 0,
  checked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.data_integrity_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrity_all" ON public.data_integrity_checks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'admin'));

-- جدول سجل العمليات الحساسة
CREATE TABLE public.sensitive_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  operation_description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  otp_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sensitive_operations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sensitive_ops_all" ON public.sensitive_operations_log FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'admin'));

CREATE INDEX idx_sensitive_ops_company ON public.sensitive_operations_log(company_id);
