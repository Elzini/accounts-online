
-- Fix: Update the audit trigger template to include SET search_path
-- This updates provision_tenant_complete and re-applies to existing schemas

CREATE OR REPLACE FUNCTION public.provision_tenant_complete(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema TEXT := 'tenant_' || replace(p_company_id::text, '-', '_');
  v_role TEXT := 'role_' || replace(p_company_id::text, '-', '_');
  v_validation JSONB;
  v_steps TEXT[] := '{}';
  v_start TIMESTAMPTZ := clock_timestamp();
  v_tables TEXT[] := ARRAY['journal_entries','journal_entry_lines','account_categories','vouchers','sales','customers','suppliers','expenses','checks','cars','installments'];
  v_tbl TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company_id) THEN
    RAISE EXCEPTION 'Company % does not exist', p_company_id;
  END IF;
  v_steps := array_append(v_steps, 'company_verified');

  -- Step 2: AES-256 key
  IF NOT EXISTS (SELECT 1 FROM tenant_encryption_keys WHERE company_id = p_company_id) THEN
    INSERT INTO tenant_encryption_keys (company_id, key_data, algorithm, created_by)
    VALUES (p_company_id, encode(gen_random_bytes(32), 'hex'), 'aes-256-gcm', auth.uid());
  END IF;
  v_steps := array_append(v_steps, 'aes256_key');

  -- Step 3: Schema + tables
  PERFORM create_tenant_schema(p_company_id);
  v_steps := array_append(v_steps, 'schema_created');

  -- Step 4: DB role
  PERFORM create_tenant_db_role(p_company_id);
  v_steps := array_append(v_steps, 'db_role');

  -- Step 5: RLS (done in create_tenant_schema)
  v_steps := array_append(v_steps, 'rls_enabled');

  -- Step 6: Quotas
  INSERT INTO tenant_resource_quotas (company_id, max_requests_per_minute, max_storage_mb, max_users, max_records_per_table)
  VALUES (p_company_id, 100, 500, 50, 100000) ON CONFLICT (company_id) DO NOTHING;
  v_steps := array_append(v_steps, 'quotas');

  -- Step 7: Cross-tenant blocking (via RLS policies)
  v_steps := array_append(v_steps, 'cross_tenant_block');

  -- Step 8: Audit triggers (with SET search_path fix)
  FOREACH v_tbl IN ARRAY v_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema AND table_name = v_tbl) THEN
      EXECUTE format('
        CREATE OR REPLACE FUNCTION %I.audit_%s() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = %I AS $fn$
        BEGIN
          INSERT INTO %I.access_audit_log (user_id, action, entity_type, entity_id, details)
          VALUES (auth.uid(), TG_OP, TG_TABLE_NAME,
            CASE WHEN TG_OP = ''DELETE'' THEN OLD.id ELSE NEW.id END,
            jsonb_build_object(''schema'', TG_TABLE_SCHEMA, ''ts'', now(), ''op'', TG_OP));
          IF TG_OP = ''DELETE'' THEN RETURN OLD; END IF; RETURN NEW;
        END; $fn$', v_schema, v_tbl, v_schema, v_schema);
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%s ON %I.%I', v_tbl, v_schema, v_tbl);
      EXECUTE format('CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION %I.audit_%s()', v_tbl, v_schema, v_tbl, v_schema, v_tbl);
    END IF;
  END LOOP;
  v_steps := array_append(v_steps, 'audit_triggers');

  -- Step 9: Encryption config
  PERFORM configure_tenant_encryption(p_company_id);
  v_steps := array_append(v_steps, 'encryption_config');

  -- Step 10: Validate
  v_validation := validate_tenant_schema(p_company_id);
  v_steps := array_append(v_steps, 'validated');

  PERFORM log_security_event('tenant_fully_provisioned', 'info', p_company_id, auth.uid(), v_schema, NULL, NULL, NULL,
    jsonb_build_object('steps', to_jsonb(v_steps), 'validation', v_validation, 'duration_ms', extract(milliseconds from clock_timestamp() - v_start)::int));

  RETURN jsonb_build_object('success', true, 'company_id', p_company_id, 'schema', v_schema, 'role', v_role,
    'steps', to_jsonb(v_steps), 'validation', v_validation, 'provisioned_at', now());
END;
$$;

-- Re-apply audit triggers with SET search_path to fix linter warnings
DO $$
DECLARE
  comp RECORD;
  v_schema TEXT;
  v_tables TEXT[] := ARRAY['journal_entries','journal_entry_lines','account_categories','vouchers','sales','customers','suppliers','expenses','checks','cars','installments'];
  v_tbl TEXT;
BEGIN
  FOR comp IN SELECT id FROM companies WHERE is_active = true LOOP
    v_schema := 'tenant_' || replace(comp.id::text, '-', '_');
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema) THEN
      FOREACH v_tbl IN ARRAY v_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema AND table_name = v_tbl) THEN
          EXECUTE format('
            CREATE OR REPLACE FUNCTION %I.audit_%s() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = %I AS $fn$
            BEGIN
              INSERT INTO %I.access_audit_log (user_id, action, entity_type, entity_id, details)
              VALUES (auth.uid(), TG_OP, TG_TABLE_NAME,
                CASE WHEN TG_OP = ''DELETE'' THEN OLD.id ELSE NEW.id END,
                jsonb_build_object(''schema'', TG_TABLE_SCHEMA, ''ts'', now(), ''op'', TG_OP));
              IF TG_OP = ''DELETE'' THEN RETURN OLD; END IF; RETURN NEW;
            END; $fn$', v_schema, v_tbl, v_schema, v_schema);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;
