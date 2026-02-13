
-- Fix pentest function: tenant_resource_quotas uses company_id not tenant_id
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
BEGIN
  v_schema := 'tenant_' || replace(p_tenant_id::text, '-', '_');

  -- TEST 1: Schema exists
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'schema_exists', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 2: RLS enabled
  v_total := v_total + 1;
  SELECT count(*) = 0 INTO v_test_passed FROM pg_tables WHERE schemaname = v_schema AND rowsecurity = false;
  v_results := v_results || jsonb_build_object('test', 'all_tables_rls', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 3: FORCE RLS
  v_total := v_total + 1;
  SELECT count(*) = 0 INTO v_test_passed FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = v_schema AND c.relkind = 'r' AND c.relforcerowsecurity = false;
  v_results := v_results || jsonb_build_object('test', 'force_rls', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 4: RLS policies
  v_total := v_total + 1;
  SELECT count(*) > 0 INTO v_test_passed FROM pg_policies WHERE schemaname = v_schema;
  v_results := v_results || jsonb_build_object('test', 'rls_policies', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 5: Encryption key
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM company_encryption_keys WHERE company_id = p_tenant_id AND is_active = true) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'encryption_key', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 6: Resource quotas (uses company_id)
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM tenant_resource_quotas WHERE company_id = p_tenant_id) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'resource_quotas', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 7: Cross-tenant triggers
  v_total := v_total + 1;
  SELECT count(*) > 0 INTO v_test_passed FROM information_schema.triggers
  WHERE trigger_schema = v_schema AND trigger_name LIKE '%cross_tenant%';
  v_results := v_results || jsonb_build_object('test', 'cross_tenant_block', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 8: Audit triggers
  v_total := v_total + 1;
  SELECT count(*) > 0 INTO v_test_passed FROM information_schema.triggers
  WHERE trigger_schema = v_schema AND trigger_name LIKE 'audit_%';
  v_results := v_results || jsonb_build_object('test', 'audit_triggers', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 9: Storage
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM tenant_storage_config WHERE tenant_id = p_tenant_id) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'storage_isolated', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- TEST 10: Network config
  v_total := v_total + 1;
  SELECT EXISTS(SELECT 1 FROM tenant_network_config WHERE tenant_id = p_tenant_id) INTO v_test_passed;
  v_results := v_results || jsonb_build_object('test', 'network_config', 'passed', v_test_passed);
  IF v_test_passed THEN v_passed := v_passed + 1; ELSE v_failed := v_failed + 1; END IF;

  -- Save results
  INSERT INTO penetration_test_results (test_type, target_tenant_id, test_description, passed, severity, details)
  VALUES ('automated_isolation', p_tenant_id, '10-point isolation check', v_failed = 0,
    CASE WHEN v_failed = 0 THEN 'info' WHEN v_failed <= 2 THEN 'warning' ELSE 'critical' END,
    jsonb_build_object('total', v_total, 'passed', v_passed, 'failed', v_failed, 'tests', v_results));

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id, 'total', v_total, 'passed', v_passed, 'failed', v_failed,
    'status', CASE WHEN v_failed = 0 THEN 'ALL_PASSED' ELSE 'ISSUES_FOUND' END, 'tests', v_results);
END;
$$;
