
-- ===== 1. Code Integrity Hashes =====
CREATE TABLE IF NOT EXISTS public.code_integrity_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  file_hash text NOT NULL,
  hash_algorithm text NOT NULL DEFAULT 'SHA-256',
  verified_at timestamptz,
  verified_by uuid,
  status text NOT NULL DEFAULT 'verified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.code_integrity_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage code integrity" ON public.code_integrity_hashes
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ===== 2. Accounting Engine Versions =====
CREATE TABLE IF NOT EXISTS public.accounting_engine_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number text NOT NULL UNIQUE,
  description text,
  changelog jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_current boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  activated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.accounting_engine_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage engine versions" ON public.accounting_engine_versions
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Insert default engine version
INSERT INTO public.accounting_engine_versions (version_number, description, is_active, is_current, activated_at)
VALUES ('1.0.0', 'النسخة الأولى - المحرك المحاسبي الأساسي', true, true, now())
ON CONFLICT (version_number) DO NOTHING;

-- ===== 3. Financial Snapshots (Time Machine) =====
CREATE TABLE IF NOT EXISTS public.financial_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  snapshot_date date NOT NULL,
  snapshot_type text NOT NULL DEFAULT 'daily',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, snapshot_date, snapshot_type)
);

ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage snapshots" ON public.financial_snapshots
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ===== 4. Two-Person Approval Requests =====
CREATE TABLE IF NOT EXISTS public.two_person_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type text NOT NULL,
  change_description text NOT NULL,
  change_payload jsonb DEFAULT '{}'::jsonb,
  impact_analysis jsonb DEFAULT '{}'::jsonb,
  simulation_result jsonb DEFAULT '{}'::jsonb,
  requested_by uuid NOT NULL,
  first_approver_id uuid,
  first_approver_role text,
  first_approved_at timestamptz,
  second_approver_id uuid,
  second_approver_role text,
  second_approved_at timestamptz,
  authorization_method text,
  backup_id uuid,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.two_person_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage approvals" ON public.two_person_approvals
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ===== 5. Security Incidents Log =====
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  detected_by text NOT NULL DEFAULT 'system',
  user_id uuid,
  ip_address text,
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid,
  auto_freeze_triggered boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage incidents" ON public.security_incidents
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Make security_incidents append-only
CREATE OR REPLACE FUNCTION prevent_security_incident_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'سجلات الحوادث الأمنية غير قابلة للتعديل أو الحذف';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_security_incidents
  BEFORE UPDATE OR DELETE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION prevent_security_incident_modification();

-- ===== 6. Financial Period Locks =====
CREATE TABLE IF NOT EXISTS public.financial_period_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  locked_by uuid NOT NULL,
  lock_reason text,
  is_locked boolean NOT NULL DEFAULT true,
  unlocked_by uuid,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, period_start, period_end)
);

ALTER TABLE public.financial_period_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage period locks" ON public.financial_period_locks
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Function to check if a date is in a locked period
CREATE OR REPLACE FUNCTION is_period_locked(p_company_id uuid, p_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.financial_period_locks
    WHERE company_id = p_company_id
      AND is_locked = true
      AND p_date BETWEEN period_start AND period_end
  );
$$;
