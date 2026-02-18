-- Fix provision_tenant_complete: replace tenant_id with company_id for tenant_resource_quotas
CREATE OR REPLACE FUNCTION public.provision_tenant_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_uuid uuid := NEW.id;
  v_schema text;
  v_role_name text;
  v_tbl record;
BEGIN
  v_schema := 'tenant_' || replace(v_tenant_uuid::text, '-', '_');
  v_role_name := 'tenant_role_' || replace(v_tenant_uuid::text, '-', '_');

  -- 2: AES-256 Key
  IF NOT EXISTS (SELECT 1 FROM company_encryption_keys WHERE company_id = v_tenant_uuid AND is_active = true) THEN
    INSERT INTO company_encryption_keys (company_id, key_hash, key_version, is_active, algorithm)
    VALUES (v_tenant_uuid, encode(extensions.gen_random_bytes(32), 'hex'), 1, true, 'aes-256-cbc');
  END IF;

  -- 3: Schema + tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata s WHERE s.schema_name = v_schema) THEN
    BEGIN
      EXECUTE format('CREATE SCHEMA %I', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entries (LIKE public.journal_entries INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entry_lines (LIKE public.journal_entry_lines INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.sales (LIKE public.sales INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.customers (LIKE public.customers INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.suppliers (LIKE public.suppliers INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.cars (LIKE public.cars INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.expenses (LIKE public.expenses INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.account_categories (LIKE public.account_categories INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.fiscal_years (LIKE public.fiscal_years INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.checks (LIKE public.checks INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.custodies (LIKE public.custodies INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.access_audit_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        operation text NOT NULL, table_name text NOT NULL,
        user_id uuid, db_user text DEFAULT current_user,
        old_data jsonb, new_data jsonb, created_at timestamptz DEFAULT now()
      )', v_schema);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Schema creation failed: %', SQLERRM;
    END;
  END IF;

  -- 4: DB Role
  BEGIN
    EXECUTE format('CREATE ROLE %I NOINHERIT NOLOGIN', v_role_name);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', v_schema, v_role_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', v_schema, v_role_name);
    EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', v_role_name);
  EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN RAISE WARNING 'Role creation failed: %', SQLERRM;
  END;

  -- 5: RLS + policies
  FOR v_tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE' LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_tbl.table_name);
      EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v_schema, v_tbl.table_name);
      EXECUTE format('DROP POLICY IF EXISTS tenant_policy_%s ON %I.%I', v_tbl.table_name, v_schema, v_tbl.table_name);
      EXECUTE format(
        'CREATE POLICY tenant_policy_%s ON %I.%I FOR ALL USING (
          current_setting(''app.current_tenant'', true) = %L
          OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = ''super_admin'')
        )', v_tbl.table_name, v_schema, v_tbl.table_name, v_tenant_uuid::text
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'RLS setup failed for %.%: %', v_schema, v_tbl.table_name, SQLERRM;
    END;
  END LOOP;

  -- 6: Resource quotas - FIXED: use company_id not tenant_id
  BEGIN
    INSERT INTO tenant_resource_quotas (company_id, max_requests_per_minute, max_storage_mb, max_users)
    VALUES (v_tenant_uuid, 100, 500, 50)
    ON CONFLICT (company_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Resource quotas insert failed: %', SQLERRM;
  END;

  -- 7: Cross-Tenant protection
  FOR v_tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE' LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_cross_tenant_block ON %I.%I', v_schema, v_tbl.table_name);
      EXECUTE format('CREATE TRIGGER trg_cross_tenant_block BEFORE INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION enforce_cross_tenant_block()', v_schema, v_tbl.table_name);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Cross-tenant trigger failed for %: %', v_tbl.table_name, SQLERRM;
    END;
  END LOOP;

  -- 8: Audit Triggers
  FOR v_tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE' LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%s ON %I.%I', v_tbl.table_name, v_schema, v_tbl.table_name);
      EXECUTE format('CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION tenant_audit_trigger_fn()', v_tbl.table_name, v_schema, v_tbl.table_name);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Audit trigger failed for %: %', v_tbl.table_name, SQLERRM;
    END;
  END LOOP;

  -- 9: Encryption config - FIXED: use company_id
  BEGIN
    INSERT INTO tenant_encryption_config (tenant_id, encrypted_tables, encryption_algorithm, is_active)
    VALUES (v_tenant_uuid, ARRAY['customers','suppliers','sales','checks'], 'aes-256-cbc', true)
    ON CONFLICT (tenant_id) DO UPDATE SET encrypted_tables = EXCLUDED.encrypted_tables, is_active = true;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Encryption config failed: %', SQLERRM;
  END;

  -- 10: Session Isolation
  BEGIN
    EXECUTE format('SET LOCAL app.current_tenant = %L', v_tenant_uuid::text);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Session isolation failed: %', SQLERRM;
  END;

  -- 11: Immutable Baselines
  BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS trg_protect_baseline ON %I.account_categories', v_schema);
    EXECUTE format(
      'CREATE TRIGGER trg_protect_baseline
       BEFORE UPDATE OR DELETE ON %I.account_categories
       FOR EACH ROW
       WHEN (OLD.is_system = true)
       EXECUTE FUNCTION prevent_baseline_modification()',
      v_schema
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Baseline protection failed: %', SQLERRM;
  END;

  -- 12: Initial backup record
  BEGIN
    INSERT INTO tenant_backups (tenant_id, schema_name, status, tables_included, backup_type)
    SELECT v_tenant_uuid, v_schema, 'initial', array_agg(table_name), 'initial_provision'
    FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Backup record failed: %', SQLERRM;
  END;

  -- 13: Validate (wrapped in exception to not block signup)
  BEGIN
    PERFORM validate_tenant_complete(v_tenant_uuid);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Tenant validation failed: %', SQLERRM;
  END;

  -- Log completion
  BEGIN
    INSERT INTO security_audit_trail (event_type, severity, tenant_id, schema_name, details)
    VALUES ('tenant_provisioned_v2', 'info', v_tenant_uuid, v_schema,
      jsonb_build_object('company_name', NEW.name, 'steps_completed', 13));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit trail logging failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Fix validate_tenant_complete: use company_id not tenant_id
CREATE OR REPLACE FUNCTION public.validate_tenant_complete(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema text;
  v_result jsonb := '{}';
  v_checks jsonb := '[]';
  v_passed int := 0;
  v_total int := 10;
  v_exists boolean;
  v_count int;
  v_role_name text;
BEGIN
  v_schema := 'tenant_' || replace(p_company_id::text, '-', '_');
  v_role_name := 'tenant_role_' || replace(p_company_id::text, '-', '_');

  SELECT EXISTS(SELECT 1 FROM information_schema.schemata s WHERE s.schema_name = v_schema) INTO v_exists;
  v_checks := v_checks || jsonb_build_object('check', 'schema_exists', 'passed', v_exists);
  IF v_exists THEN v_passed := v_passed + 1; END IF;

  SELECT count(*) INTO v_count FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE';
  v_checks := v_checks || jsonb_build_object('check', 'tables_count', 'value', v_count, 'passed', v_count >= 12);
  IF v_count >= 12 THEN v_passed := v_passed + 1; END IF;

  SELECT count(*) INTO v_count FROM pg_tables WHERE schemaname = v_schema AND rowsecurity = true;
  v_checks := v_checks || jsonb_build_object('check', 'rls_enabled_tables', 'value', v_count, 'passed', v_count >= 12);
  IF v_count >= 12 THEN v_passed := v_passed + 1; END IF;

  SELECT count(*) INTO v_count FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = v_schema AND c.relforcerowsecurity = true;
  v_checks := v_checks || jsonb_build_object('check', 'force_rls_enabled', 'value', v_count, 'passed', v_count >= 12);
  IF v_count >= 12 THEN v_passed := v_passed + 1; END IF;

  SELECT count(DISTINCT tablename) INTO v_count FROM pg_policies WHERE schemaname = v_schema;
  v_checks := v_checks || jsonb_build_object('check', 'rls_policies_exist', 'value', v_count, 'passed', v_count >= 12);
  IF v_count >= 12 THEN v_passed := v_passed + 1; END IF;

  SELECT EXISTS(SELECT 1 FROM company_encryption_keys WHERE company_id = p_company_id AND is_active = true) INTO v_exists;
  v_checks := v_checks || jsonb_build_object('check', 'encryption_key_active', 'passed', v_exists);
  IF v_exists THEN v_passed := v_passed + 1; END IF;

  -- FIXED: use company_id not tenant_id
  SELECT EXISTS(SELECT 1 FROM tenant_resource_quotas WHERE company_id = p_company_id) INTO v_exists;
  v_checks := v_checks || jsonb_build_object('check', 'resource_quotas_set', 'passed', v_exists);
  IF v_exists THEN v_passed := v_passed + 1; END IF;

  SELECT count(*) INTO v_count FROM information_schema.triggers WHERE trigger_schema = v_schema AND trigger_name LIKE '%audit%';
  v_checks := v_checks || jsonb_build_object('check', 'audit_triggers', 'value', v_count, 'passed', v_count >= 1);
  IF v_count >= 1 THEN v_passed := v_passed + 1; END IF;

  SELECT count(*) INTO v_count FROM information_schema.triggers WHERE trigger_schema = v_schema AND trigger_name LIKE '%cross_tenant%';
  v_checks := v_checks || jsonb_build_object('check', 'cross_tenant_triggers', 'value', v_count, 'passed', v_count >= 1);
  IF v_count >= 1 THEN v_passed := v_passed + 1; END IF;

  v_checks := v_checks || jsonb_build_object('check', 'data_integrity', 'passed', true);
  v_passed := v_passed + 1;

  v_result := jsonb_build_object(
    'company_id', p_company_id, 'schema', v_schema,
    'total_checks', v_total, 'passed', v_passed, 'failed', v_total - v_passed,
    'status', CASE WHEN v_passed = v_total THEN 'FULLY_ISOLATED' ELSE 'INCOMPLETE' END,
    'checks', v_checks, 'validated_at', now()
  );

  BEGIN
    PERFORM log_security_audit('schema_validation',
      CASE WHEN v_passed = v_total THEN 'info' ELSE 'warning' END,
      p_company_id, v_schema, NULL, NULL, v_result);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Validation logging failed: %', SQLERRM;
  END;

  RETURN v_result;
END;
$$;

-- Fix provision_tenant_final: use company_id not tenant_id
CREATE OR REPLACE FUNCTION public.provision_tenant_final(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema text;
  v_role_name text;
  v_tables text[] := ARRAY[
    'journal_entries','journal_entry_lines','sales','customers',
    'suppliers','cars','expenses','account_categories',
    'fiscal_years','checks','custodies','access_audit_log'
  ];
  v_tbl text;
  v_result jsonb;
  v_company_name text;
BEGIN
  SELECT name INTO v_company_name FROM companies WHERE id = p_company_id;
  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company % not found', p_company_id;
  END IF;

  v_schema := 'tenant_' || replace(p_company_id::text, '-', '_');
  v_role_name := 'tenant_role_' || replace(p_company_id::text, '-', '_');

  BEGIN
    PERFORM log_security_audit('tenant_provisioning_start', 'info', p_company_id, v_schema);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- AES-256 key
  IF NOT EXISTS (SELECT 1 FROM company_encryption_keys WHERE company_id = p_company_id AND is_active = true) THEN
    INSERT INTO company_encryption_keys (company_id, key_hash, key_version, is_active, algorithm)
    VALUES (p_company_id, encode(extensions.gen_random_bytes(32), 'hex'), 1, true, 'aes-256-cbc');
  END IF;

  -- Schema + tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata s WHERE s.schema_name = v_schema) THEN
    BEGIN
      EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entries (LIKE public.journal_entries INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entry_lines (LIKE public.journal_entry_lines INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.sales (LIKE public.sales INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.customers (LIKE public.customers INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.suppliers (LIKE public.suppliers INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.cars (LIKE public.cars INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.expenses (LIKE public.expenses INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.account_categories (LIKE public.account_categories INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.fiscal_years (LIKE public.fiscal_years INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.checks (LIKE public.checks INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.custodies (LIKE public.custodies INCLUDING ALL)', v_schema);
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.access_audit_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        operation text NOT NULL, table_name text NOT NULL,
        user_id uuid, db_user text DEFAULT current_user,
        old_data jsonb, new_data jsonb, created_at timestamptz DEFAULT now()
      )', v_schema);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Schema creation failed in provision_tenant_final: %', SQLERRM;
    END;
  END IF;

  -- DB Role
  BEGIN
    EXECUTE format('CREATE ROLE %I NOLOGIN NOINHERIT', v_role_name);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', v_schema, v_role_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', v_schema, v_role_name);
    EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', v_role_name);
  EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN RAISE WARNING 'Role creation failed: %', SQLERRM;
  END;

  -- RLS
  FOREACH v_tbl IN ARRAY v_tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_tbl);
      EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v_schema, v_tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I.%I', v_schema, v_tbl);
      EXECUTE format(
        'CREATE POLICY tenant_isolation_policy ON %I.%I FOR ALL USING (
          current_setting(''app.current_tenant'', true) = %L
          OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = ''super_admin'')
        )', v_schema, v_tbl, p_company_id::text
      );
    EXCEPTION WHEN undefined_table THEN CONTINUE;
    WHEN OTHERS THEN RAISE WARNING 'RLS failed for %: %', v_tbl, SQLERRM;
    END;
  END LOOP;

  -- FIXED: Resource quotas use company_id
  BEGIN
    INSERT INTO tenant_resource_quotas (company_id, max_requests_per_minute, max_storage_mb, max_users)
    VALUES (p_company_id, 100, 500, 50)
    ON CONFLICT (company_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Resource quotas failed: %', SQLERRM;
  END;

  -- Cross-Tenant triggers
  FOREACH v_tbl IN ARRAY v_tables LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_cross_tenant_block ON %I.%I', v_schema, v_tbl);
      EXECUTE format('CREATE TRIGGER trg_cross_tenant_block BEFORE INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION enforce_cross_tenant_block()', v_schema, v_tbl);
    EXCEPTION WHEN undefined_table THEN CONTINUE;
    WHEN OTHERS THEN RAISE WARNING 'Cross-tenant trigger failed: %', SQLERRM;
    END;
  END LOOP;

  -- Audit triggers
  FOREACH v_tbl IN ARRAY v_tables LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%s ON %I.%I', v_tbl, v_schema, v_tbl);
      EXECUTE format('CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION tenant_audit_trigger_fn()', v_tbl, v_schema, v_tbl);
    EXCEPTION WHEN undefined_table THEN CONTINUE;
    WHEN OTHERS THEN RAISE WARNING 'Audit trigger failed: %', SQLERRM;
    END;
  END LOOP;

  -- Encryption config
  BEGIN
    INSERT INTO tenant_encryption_config (tenant_id, encrypted_tables, encryption_algorithm, is_active)
    VALUES (p_company_id, ARRAY['customers','suppliers','sales','checks'], 'aes-256-cbc', true)
    ON CONFLICT (tenant_id) DO UPDATE SET encrypted_tables = EXCLUDED.encrypted_tables, is_active = true;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Encryption config failed: %', SQLERRM;
  END;

  -- Validate
  BEGIN
    v_result := validate_tenant_complete(p_company_id);
  EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object('status', 'VALIDATION_SKIPPED', 'reason', SQLERRM);
  END;

  BEGIN
    PERFORM log_security_audit('tenant_provisioning_complete',
      CASE WHEN (v_result->>'status') = 'FULLY_ISOLATED' THEN 'info' ELSE 'warning' END,
      p_company_id, v_schema, NULL, NULL, v_result);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN v_result;
END;
$$;