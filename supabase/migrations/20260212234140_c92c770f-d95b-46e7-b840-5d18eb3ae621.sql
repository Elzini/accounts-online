
-- ============================================================
-- COMPREHENSIVE SECURITY HARDENING - ALL IN ONE
-- ============================================================

-- 2️⃣ SECURITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  company_id UUID REFERENCES public.companies(id),
  user_id UUID,
  source_schema TEXT,
  target_schema TEXT,
  table_name TEXT,
  operation TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events FORCE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_only_events" ON public.security_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));
CREATE INDEX idx_security_events_type ON public.security_events(event_type, severity);
CREATE INDEX idx_security_events_company ON public.security_events(company_id, created_at DESC);
CREATE INDEX idx_security_events_unresolved ON public.security_events(resolved, severity) WHERE resolved = false;

-- Log security event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT, p_severity TEXT, p_company_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL, p_source_schema TEXT DEFAULT NULL,
  p_target_schema TEXT DEFAULT NULL, p_table_name TEXT DEFAULT NULL,
  p_operation TEXT DEFAULT NULL, p_details JSONB DEFAULT '{}'
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE event_id UUID;
BEGIN
  INSERT INTO security_events (event_type, severity, company_id, user_id, source_schema, target_schema, table_name, operation, details)
  VALUES (p_event_type, p_severity, p_company_id, COALESCE(p_user_id, auth.uid()), p_source_schema, p_target_schema, p_table_name, p_operation, p_details)
  RETURNING id INTO event_id;
  IF p_severity IN ('critical', 'emergency') THEN
    INSERT INTO public.notifications (company_id, title, message, type, is_read)
    SELECT p.company_id, '🚨 تنبيه أمني: ' || p_event_type,
      'تم اكتشاف ' || p_event_type || ' على ' || COALESCE(p_table_name, 'unknown'), 'security_alert', false
    FROM public.profiles p JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE ur.permission = 'super_admin' LIMIT 5;
  END IF;
  RETURN event_id;
END; $$;

-- Enhanced cross-tenant blocking with logging
CREATE OR REPLACE FUNCTION public.block_cross_tenant_access()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_company UUID; target_company UUID;
BEGIN
  SELECT company_id INTO user_company FROM profiles WHERE user_id = auth.uid() LIMIT 1;
  IF TG_OP = 'DELETE' THEN target_company := OLD.company_id; ELSE target_company := NEW.company_id; END IF;
  IF user_company IS NOT NULL AND target_company IS NOT NULL AND user_company != target_company THEN
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND permission = 'super_admin') THEN
      PERFORM log_security_event('cross_tenant_attempt', 'critical', target_company, auth.uid(), NULL, NULL, TG_TABLE_NAME, TG_OP,
        jsonb_build_object('user_company', user_company, 'target_company', target_company, 'blocked', true));
      RAISE EXCEPTION 'Cross-tenant access blocked and logged';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;

-- 3️⃣ TENANT DB ROLES TABLE
CREATE TABLE IF NOT EXISTS public.tenant_db_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL UNIQUE,
  schema_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.tenant_db_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_db_roles FORCE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_only_roles" ON public.tenant_db_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

-- Create tenant DB role function
CREATE OR REPLACE FUNCTION public.create_tenant_db_role(p_company_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_schema TEXT := 'tenant_' || replace(p_company_id::text, '-', '_');
  v_role TEXT := 'role_' || replace(p_company_id::text, '-', '_');
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = v_role) INTO v_exists;
  IF NOT v_exists THEN
    EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE', v_role);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', v_schema, v_role);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', v_schema, v_role);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I', v_schema, v_role);
    EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', v_role);
    INSERT INTO public.tenant_db_roles (company_id, role_name, schema_name) VALUES (p_company_id, v_role, v_schema) ON CONFLICT (role_name) DO NOTHING;
    PERFORM log_security_event('tenant_role_created', 'info', p_company_id, NULL, v_schema, NULL, NULL, NULL, jsonb_build_object('role_name', v_role));
  END IF;
  RETURN v_role;
END; $$;

-- 4️⃣ ENCRYPTION CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.tenant_encryption_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  schema_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  encrypted_columns TEXT[] NOT NULL DEFAULT '{}',
  encryption_algorithm TEXT DEFAULT 'aes-256-gcm',
  key_rotation_days INT DEFAULT 90,
  last_key_rotation TIMESTAMPTZ,
  next_key_rotation TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, schema_name, table_name)
);
ALTER TABLE public.tenant_encryption_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_encryption_config FORCE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_only_enc" ON public.tenant_encryption_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

-- Configure encryption for tenant
CREATE OR REPLACE FUNCTION public.configure_tenant_encryption(p_company_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_schema TEXT := 'tenant_' || replace(p_company_id::text, '-', '_');
  v_tables TEXT[] := ARRAY['customers', 'suppliers', 'checks', 'sales', 'expenses'];
  v_tbl TEXT;
BEGIN
  FOREACH v_tbl IN ARRAY v_tables LOOP
    INSERT INTO public.tenant_encryption_config (company_id, schema_name, table_name, encrypted_columns, last_key_rotation, next_key_rotation)
    VALUES (p_company_id, v_schema, v_tbl,
      CASE v_tbl
        WHEN 'customers' THEN ARRAY['phone','id_number_encrypted','address']
        WHEN 'suppliers' THEN ARRAY['phone','id_number_encrypted','address']
        WHEN 'checks' THEN ARRAY['drawer_name','payee_name']
        WHEN 'sales' THEN ARRAY['sale_price']
        WHEN 'expenses' THEN ARRAY['amount']
      END, now(), now() + interval '90 days')
    ON CONFLICT (company_id, schema_name, table_name) DO NOTHING;
  END LOOP;
END; $$;

-- 5️⃣ AUTO-THROTTLING
CREATE OR REPLACE FUNCTION public.check_and_throttle_tenant(p_company_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_quota RECORD; v_requests INT; v_users INT;
  v_throttled BOOLEAN := false; v_violations TEXT[] := '{}';
BEGIN
  SELECT * INTO v_quota FROM tenant_resource_quotas WHERE company_id = p_company_id;
  IF v_quota IS NULL THEN RETURN jsonb_build_object('throttled', false); END IF;
  SELECT COUNT(*) INTO v_requests FROM rate_limit_log WHERE company_id = p_company_id AND created_at > now() - interval '1 minute';
  IF v_requests >= v_quota.max_requests_per_minute THEN
    v_throttled := true; v_violations := array_append(v_violations, 'rate_limit');
    PERFORM log_security_event('quota_exceeded', 'warning', p_company_id, auth.uid(), NULL, NULL, NULL, NULL,
      jsonb_build_object('type', 'requests', 'current', v_requests, 'limit', v_quota.max_requests_per_minute));
  END IF;
  SELECT COUNT(*) INTO v_users FROM profiles WHERE company_id = p_company_id;
  IF v_users >= v_quota.max_users THEN
    v_violations := array_append(v_violations, 'max_users');
    PERFORM log_security_event('quota_exceeded', 'warning', p_company_id, auth.uid(), NULL, NULL, NULL, NULL,
      jsonb_build_object('type', 'users', 'current', v_users, 'limit', v_quota.max_users));
  END IF;
  -- Auto-suspend on 3+ critical violations in 1 hour
  IF (SELECT COUNT(*) FROM security_events WHERE company_id = p_company_id AND severity = 'critical' AND created_at > now() - interval '1 hour' AND resolved = false) >= 3 THEN
    UPDATE companies SET is_active = false WHERE id = p_company_id;
    PERFORM log_security_event('auto_suspension', 'emergency', p_company_id, NULL, NULL, NULL, NULL, NULL,
      jsonb_build_object('reason', '3+ critical violations', 'auto_suspended', true));
    v_throttled := true; v_violations := array_append(v_violations, 'auto_suspended');
  END IF;
  RETURN jsonb_build_object('throttled', v_throttled, 'violations', to_jsonb(v_violations), 'requests', v_requests, 'users', v_users);
END; $$;

-- 6️⃣ IMMUTABLE BASELINES
CREATE TABLE IF NOT EXISTS public.immutable_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_type TEXT NOT NULL,
  baseline_key TEXT NOT NULL,
  baseline_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(baseline_type, baseline_key)
);
ALTER TABLE public.immutable_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immutable_baselines FORCE ROW LEVEL SECURITY;
CREATE POLICY "read_baselines" ON public.immutable_baselines FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "manage_baselines" ON public.immutable_baselines FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

-- Protect system accounts trigger
CREATE OR REPLACE FUNCTION public.protect_system_accounts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.is_system = true AND TG_OP IN ('UPDATE', 'DELETE') THEN
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND permission = 'super_admin') THEN
      PERFORM log_security_event('immutable_baseline_violation', 'critical', OLD.company_id, auth.uid(),
        NULL, NULL, TG_TABLE_NAME, TG_OP, jsonb_build_object('record_id', OLD.id, 'blocked', true));
      RAISE EXCEPTION 'System accounts are immutable';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_protect_system_accounts ON public.account_categories;
CREATE TRIGGER trg_protect_system_accounts BEFORE UPDATE OR DELETE ON public.account_categories
  FOR EACH ROW EXECUTE FUNCTION protect_system_accounts();

-- 7️⃣ SCHEMA VALIDATION
CREATE OR REPLACE FUNCTION public.validate_tenant_schema(p_company_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_schema TEXT := 'tenant_' || replace(p_company_id::text, '-', '_');
  v_tables TEXT[] := ARRAY['journal_entries','journal_entry_lines','account_categories','vouchers','sales','customers','suppliers','expenses','checks','cars','installments','access_audit_log'];
  v_tbl TEXT; v_missing TEXT[] := '{}'; v_no_rls TEXT[] := '{}';
  v_errors TEXT[] := '{}'; v_schema_exists BOOLEAN; v_has_rls BOOLEAN;
  v_enc BOOLEAN; v_role BOOLEAN; v_quota BOOLEAN; v_enc_cfg BOOLEAN;
  v_score INT := 0; v_max INT := 7;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema) INTO v_schema_exists;
  IF NOT v_schema_exists THEN
    RETURN jsonb_build_object('valid', false, 'score', 0, 'max_score', v_max, 'errors', ARRAY['Schema missing']);
  END IF;
  v_score := v_score + 1;

  FOREACH v_tbl IN ARRAY v_tables LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema AND table_name = v_tbl) THEN
      v_missing := array_append(v_missing, v_tbl);
    END IF;
  END LOOP;
  IF array_length(v_missing, 1) IS NULL THEN v_score := v_score + 1;
  ELSE v_errors := array_append(v_errors, 'Missing: ' || array_to_string(v_missing, ',')); END IF;

  FOREACH v_tbl IN ARRAY v_tables LOOP
    SELECT rowsecurity INTO v_has_rls FROM pg_tables WHERE schemaname = v_schema AND tablename = v_tbl;
    IF v_has_rls IS NOT TRUE THEN v_no_rls := array_append(v_no_rls, v_tbl); END IF;
  END LOOP;
  IF array_length(v_no_rls, 1) IS NULL THEN v_score := v_score + 1;
  ELSE v_errors := array_append(v_errors, 'No RLS: ' || array_to_string(v_no_rls, ',')); END IF;

  SELECT EXISTS(SELECT 1 FROM tenant_encryption_keys WHERE company_id = p_company_id) INTO v_enc;
  IF v_enc THEN v_score := v_score + 1; ELSE v_errors := array_append(v_errors, 'No encryption key'); END IF;

  SELECT EXISTS(SELECT 1 FROM public.tenant_db_roles WHERE company_id = p_company_id AND is_active = true) INTO v_role;
  IF v_role THEN v_score := v_score + 1; ELSE v_errors := array_append(v_errors, 'No DB role'); END IF;

  SELECT EXISTS(SELECT 1 FROM tenant_resource_quotas WHERE company_id = p_company_id) INTO v_quota;
  IF v_quota THEN v_score := v_score + 1; ELSE v_errors := array_append(v_errors, 'No quotas'); END IF;

  SELECT EXISTS(SELECT 1 FROM public.tenant_encryption_config WHERE company_id = p_company_id) INTO v_enc_cfg;
  IF v_enc_cfg THEN v_score := v_score + 1; ELSE v_errors := array_append(v_errors, 'No encryption config'); END IF;

  PERFORM log_security_event('schema_validation', CASE WHEN v_score = v_max THEN 'info' ELSE 'warning' END,
    p_company_id, auth.uid(), v_schema, NULL, NULL, NULL,
    jsonb_build_object('score', v_score, 'max_score', v_max, 'errors', v_errors));

  RETURN jsonb_build_object('valid', v_score = v_max, 'score', v_score, 'max_score', v_max, 'errors', to_jsonb(v_errors),
    'checks', jsonb_build_object('schema', v_schema_exists, 'tables', array_length(v_missing,1) IS NULL,
      'rls', array_length(v_no_rls,1) IS NULL, 'encryption', v_enc, 'role', v_role, 'quotas', v_quota));
END; $$;

-- Update create_tenant_schema with full security chain
CREATE OR REPLACE FUNCTION public.create_tenant_schema(p_company_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_schema TEXT := 'tenant_' || replace(p_company_id::text, '-', '_');
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entries (id UUID PRIMARY KEY, entry_number TEXT, entry_date DATE, description TEXT, total_debit NUMERIC DEFAULT 0, total_credit NUMERIC DEFAULT 0, status TEXT DEFAULT ''draft'', fiscal_year_id UUID, created_by UUID, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entry_lines (id UUID PRIMARY KEY, journal_entry_id UUID, account_id UUID, description TEXT, debit NUMERIC DEFAULT 0, credit NUMERIC DEFAULT 0, cost_center_id UUID, created_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.account_categories (id UUID PRIMARY KEY, code TEXT, name TEXT, type TEXT, parent_id UUID, description TEXT, is_system BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.vouchers (id UUID PRIMARY KEY, voucher_number TEXT, voucher_type TEXT, amount NUMERIC DEFAULT 0, description TEXT, beneficiary TEXT, status TEXT DEFAULT ''draft'', voucher_date DATE, journal_entry_id UUID, fiscal_year_id UUID, account_id UUID, created_by UUID, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.sales (id UUID PRIMARY KEY, car_id UUID, customer_id UUID, sale_price NUMERIC DEFAULT 0, sale_date DATE, payment_method TEXT, fiscal_year_id UUID, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.customers (id UUID PRIMARY KEY, name TEXT, phone TEXT, id_number_encrypted TEXT, address TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.suppliers (id UUID PRIMARY KEY, name TEXT, phone TEXT, id_number_encrypted TEXT, address TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.expenses (id UUID PRIMARY KEY, description TEXT, amount NUMERIC DEFAULT 0, expense_date DATE, category TEXT, account_id UUID, fiscal_year_id UUID, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.checks (id UUID PRIMARY KEY, check_number TEXT, check_type TEXT, amount NUMERIC DEFAULT 0, issue_date DATE, due_date DATE, status TEXT DEFAULT ''pending'', bank_name TEXT, drawer_name TEXT, payee_name TEXT, bank_account_id UUID, customer_id UUID, supplier_id UUID, journal_entry_id UUID, fiscal_year_id UUID, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.cars (id UUID PRIMARY KEY, name TEXT, chassis_number TEXT, model TEXT, color TEXT, purchase_price NUMERIC DEFAULT 0, purchase_date DATE, status TEXT DEFAULT ''available'', inventory_number INT, supplier_id UUID, fiscal_year_id UUID, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.installments (id UUID PRIMARY KEY, sale_id UUID, customer_id UUID, installment_number INT, amount NUMERIC DEFAULT 0, due_date DATE, paid_date DATE, status TEXT DEFAULT ''pending'', notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.access_audit_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, action TEXT, entity_type TEXT, entity_id UUID, details JSONB, ip_address TEXT, created_at TIMESTAMPTZ DEFAULT now())', v_schema);

  -- Security chain
  PERFORM apply_tenant_schema_rls(v_schema);
  PERFORM create_tenant_db_role(p_company_id);
  PERFORM configure_tenant_encryption(p_company_id);
  PERFORM log_security_event('tenant_provisioned', 'info', p_company_id, NULL, v_schema, NULL, NULL, NULL,
    jsonb_build_object('schema', v_schema, 'security_chain', 'complete'));
  RAISE NOTICE 'Tenant % fully provisioned', v_schema;
END; $$;

-- Apply roles + encryption to existing tenants
DO $$
DECLARE comp RECORD;
BEGIN
  FOR comp IN SELECT id FROM companies WHERE is_active = true LOOP
    PERFORM create_tenant_db_role(comp.id);
    PERFORM configure_tenant_encryption(comp.id);
  END LOOP;
END; $$;

-- Enable realtime for security alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
