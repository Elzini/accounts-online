
-- =====================================================
-- تعزيز Audit & Monitoring Layer
-- =====================================================

-- 1) حماية security_audit_trail من التعديل/الحذف (Immutable)
CREATE OR REPLACE FUNCTION public.protect_security_audit_trail()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'SECURITY: Audit trail records are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_audit_trail ON public.security_audit_trail;
CREATE TRIGGER trg_immutable_audit_trail
  BEFORE UPDATE OR DELETE ON public.security_audit_trail
  FOR EACH ROW EXECUTE FUNCTION protect_security_audit_trail();

-- 2) جدول SIEM Integration endpoints
CREATE TABLE IF NOT EXISTS public.siem_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  endpoint_url text NOT NULL,
  api_key_hash text,
  event_types text[] DEFAULT ARRAY['critical','warning'],
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  failure_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.siem_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage SIEM"
  ON public.siem_integrations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

-- 3) جدول نتائج اختبارات الاختراق
CREATE TABLE IF NOT EXISTS public.penetration_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type text NOT NULL,
  target_tenant_id uuid,
  test_description text NOT NULL,
  passed boolean NOT NULL,
  severity text DEFAULT 'info',
  details jsonb DEFAULT '{}',
  tested_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.penetration_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view pen tests"
  ON public.penetration_test_results FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

-- 4) دالة اختبار اختراق تلقائي لعزل Tenant
CREATE OR REPLACE FUNCTION public.run_tenant_isolation_pentest(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_schema text;
  v_results jsonb := '[]';
  v_passed int := 0;
  v_failed int := 0;
  v_total int := 0;
  v_test_passed boolean;
  v_other_tenant uuid;
  v_count int;
BEGIN
  v_schema := 'tenant_' || replace(p_tenant_id::text, '-', '_');

  -- جلب tenant آخر للاختبار
  SELECT id INTO v_other_tenant FROM companies WHERE id != p_tenant_id LIMIT 1;

  -- TEST 1: Schema موجود ومعزول
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'schema_exists', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 2: RLS مفعّل على كل الجداول
  v_total := v_total + 1;
  SELECT count(*) = 0 INTO v_test_passed FROM pg_tables 
  WHERE schemaname = v_schema AND rowsecurity = false;
  v_results := v_results || jsonb_build_object('test', 'all_tables_rls_enabled', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 3: FORCE RLS مفعّل
  v_total := v_total + 1;
  SELECT count(*) = 0 INTO v_test_passed FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = v_schema AND c.relkind = 'r' AND c.relforcerowsecurity = false;
  v_results := v_results || jsonb_build_object('test', 'force_rls_enabled', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 4: سياسات RLS موجودة
  v_total := v_total + 1;
  SELECT count(*) > 0 INTO v_test_passed FROM pg_policies WHERE schemaname = v_schema;
  v_results := v_results || jsonb_build_object('test', 'rls_policies_exist', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 5: مفتاح تشفير نشط
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM company_encryption_keys WHERE company_id = p_tenant_id AND is_active = true) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'encryption_key_active', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 6: Resource Quotas معيّنة
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM tenant_resource_quotas WHERE tenant_id = p_tenant_id) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'resource_quotas_set', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 7: Cross-tenant triggers موجودة
  v_total := v_total + 1;
  SELECT count(*) > 0 INTO v_test_passed FROM information_schema.triggers
  WHERE trigger_schema = v_schema AND trigger_name LIKE '%cross_tenant%';
  v_results := v_results || jsonb_build_object('test', 'cross_tenant_triggers', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 8: Audit triggers موجودة
  v_total := v_total + 1;
  SELECT count(*) > 0 INTO v_test_passed FROM information_schema.triggers
  WHERE trigger_schema = v_schema AND trigger_name LIKE 'audit_%';
  v_results := v_results || jsonb_build_object('test', 'audit_triggers', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 9: Storage bucket منفصل
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM tenant_storage_config WHERE tenant_id = p_tenant_id) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'storage_isolated', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 10: Network config موجود
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM tenant_network_config WHERE tenant_id = p_tenant_id) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'network_config_exists', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- حفظ النتائج
  INSERT INTO penetration_test_results (test_type, target_tenant_id, test_description, passed, severity, details, tested_by)
  VALUES (
    'automated_isolation_check', p_tenant_id,
    'Automated 10-point tenant isolation verification',
    v_failed = 0,
    CASE WHEN v_failed = 0 THEN 'info' WHEN v_failed <= 2 THEN 'warning' ELSE 'critical' END,
    jsonb_build_object('total', v_total, 'passed', v_passed, 'failed', v_failed, 'tests', v_results),
    auth.uid()
  );

  -- تسجيل في audit trail
  INSERT INTO security_audit_trail (event_type, severity, tenant_id, details)
  VALUES ('penetration_test_completed',
    CASE WHEN v_failed = 0 THEN 'info' ELSE 'warning' END,
    p_tenant_id,
    jsonb_build_object('passed', v_passed, 'failed', v_failed, 'total', v_total));

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'schema', v_schema,
    'total_tests', v_total,
    'passed', v_passed,
    'failed', v_failed,
    'status', CASE WHEN v_failed = 0 THEN 'ALL_PASSED' ELSE 'VULNERABILITIES_FOUND' END,
    'tests', v_results,
    'tested_at', now()
  );
END;
$$;

-- 5) دالة تشغيل Pentest على جميع الشركات
CREATE OR REPLACE FUNCTION public.run_all_tenants_pentest()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company record;
  v_results jsonb := '[]';
  v_result jsonb;
BEGIN
  FOR v_company IN SELECT id, name FROM companies LOOP
    v_result := run_tenant_isolation_pentest(v_company.id);
    v_results := v_results || jsonb_build_object('company', v_company.name, 'result', v_result);
  END LOOP;
  RETURN v_results;
END;
$$;
