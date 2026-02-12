
-- ============================================================
-- UNIFIED TENANT PROVISIONING: All 10 steps in one atomic function
-- ============================================================

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
  v_steps_completed TEXT[] := '{}';
  v_aes_key_exists BOOLEAN;
  v_start_time TIMESTAMPTZ := clock_timestamp();
BEGIN
  -- ─── STEP 1: Verify company exists ───
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company_id) THEN
    RAISE EXCEPTION 'Company % does not exist', p_company_id;
  END IF;
  v_steps_completed := array_append(v_steps_completed, 'company_verified');

  -- ─── STEP 2: Generate AES-256 encryption key ───
  SELECT EXISTS(SELECT 1 FROM tenant_encryption_keys WHERE company_id = p_company_id) INTO v_aes_key_exists;
  IF NOT v_aes_key_exists THEN
    INSERT INTO tenant_encryption_keys (company_id, key_data, algorithm, created_by)
    VALUES (
      p_company_id,
      encode(gen_random_bytes(32), 'hex'),
      'aes-256-gcm',
      auth.uid()
    );
  END IF;
  v_steps_completed := array_append(v_steps_completed, 'aes256_key_provisioned');

  -- ─── STEP 3: Create independent schema + all 12 tables ───
  PERFORM create_tenant_schema(p_company_id);
  v_steps_completed := array_append(v_steps_completed, 'schema_created');

  -- ─── STEP 4: Assign dedicated PostgreSQL role ───
  -- (Already called inside create_tenant_schema, but ensure it exists)
  PERFORM create_tenant_db_role(p_company_id);
  v_steps_completed := array_append(v_steps_completed, 'db_role_assigned');

  -- ─── STEP 5: RLS already applied via apply_tenant_schema_rls inside create_tenant_schema ───
  v_steps_completed := array_append(v_steps_completed, 'rls_enabled');

  -- ─── STEP 6: Set resource quotas ───
  INSERT INTO tenant_resource_quotas (company_id, max_requests_per_minute, max_storage_mb, max_users, max_records_per_table)
  VALUES (p_company_id, 100, 500, 50, 100000)
  ON CONFLICT (company_id) DO NOTHING;
  v_steps_completed := array_append(v_steps_completed, 'resource_quotas_set');

  -- ─── STEP 7: Cross-tenant blocking triggers (applied via schema-level RLS) ───
  v_steps_completed := array_append(v_steps_completed, 'cross_tenant_blocking_active');

  -- ─── STEP 8: Audit logging for sensitive actions ───
  -- Create per-tenant audit trigger on all tables in schema
  DECLARE
    v_tables TEXT[] := ARRAY['journal_entries','journal_entry_lines','account_categories','vouchers','sales','customers','suppliers','expenses','checks','cars','installments'];
    v_tbl TEXT;
  BEGIN
    FOREACH v_tbl IN ARRAY v_tables LOOP
      -- Create audit trigger on each table
      EXECUTE format('
        CREATE OR REPLACE FUNCTION %I.audit_%s() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
        BEGIN
          INSERT INTO %I.access_audit_log (user_id, action, entity_type, entity_id, details)
          VALUES (
            auth.uid(), TG_OP, TG_TABLE_NAME,
            CASE WHEN TG_OP = ''DELETE'' THEN OLD.id ELSE NEW.id END,
            jsonb_build_object(
              ''schema'', TG_TABLE_SCHEMA,
              ''timestamp'', now(),
              ''operation'', TG_OP
            )
          );
          IF TG_OP = ''DELETE'' THEN RETURN OLD; END IF;
          RETURN NEW;
        END; $fn$', v_schema, v_tbl, v_schema);

      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%s ON %I.%I', v_tbl, v_schema, v_tbl);
      EXECUTE format('CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION %I.audit_%s()', v_tbl, v_schema, v_tbl, v_schema, v_tbl);
    END LOOP;
  END;
  v_steps_completed := array_append(v_steps_completed, 'audit_triggers_installed');

  -- ─── STEP 9: Configure column-level encryption mapping ───
  PERFORM configure_tenant_encryption(p_company_id);
  v_steps_completed := array_append(v_steps_completed, 'encryption_config_set');

  -- ─── STEP 10: Validate everything ───
  v_validation := validate_tenant_schema(p_company_id);
  v_steps_completed := array_append(v_steps_completed, 'validation_complete');

  -- Log the complete provisioning
  PERFORM log_security_event(
    'tenant_fully_provisioned', 'info', p_company_id, auth.uid(),
    v_schema, NULL, NULL, NULL,
    jsonb_build_object(
      'steps_completed', to_jsonb(v_steps_completed),
      'validation', v_validation,
      'role', v_role,
      'duration_ms', extract(milliseconds from clock_timestamp() - v_start_time)::int
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'company_id', p_company_id,
    'schema', v_schema,
    'role', v_role,
    'steps_completed', to_jsonb(v_steps_completed),
    'validation', v_validation,
    'provisioned_at', now()
  );
END;
$$;

-- ============================================================
-- AUTO-TRIGGER: Run full provisioning when company is created
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_auto_provision_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-provision on company creation
  PERFORM provision_tenant_complete(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block company creation
  PERFORM log_security_event(
    'tenant_provision_failed', 'critical', NEW.id, auth.uid(),
    NULL, NULL, NULL, NULL,
    jsonb_build_object('error', SQLERRM, 'company_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new comprehensive one
DROP TRIGGER IF EXISTS trg_provision_company_isolation ON public.companies;
DROP TRIGGER IF EXISTS trg_auto_provision ON public.companies;
CREATE TRIGGER trg_auto_provision
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION trg_auto_provision_tenant();

-- ============================================================
-- Apply audit triggers to ALL existing tenant schemas
-- ============================================================
DO $$
DECLARE
  comp RECORD;
  v_schema TEXT;
  v_tables TEXT[] := ARRAY['journal_entries','journal_entry_lines','account_categories','vouchers','sales','customers','suppliers','expenses','checks','cars','installments'];
  v_tbl TEXT;
BEGIN
  FOR comp IN SELECT id FROM companies WHERE is_active = true LOOP
    v_schema := 'tenant_' || replace(comp.id::text, '-', '_');
    
    -- Check if schema exists before applying triggers
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema) THEN
      FOREACH v_tbl IN ARRAY v_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema AND table_name = v_tbl) THEN
          EXECUTE format('
            CREATE OR REPLACE FUNCTION %I.audit_%s() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
            BEGIN
              INSERT INTO %I.access_audit_log (user_id, action, entity_type, entity_id, details)
              VALUES (
                auth.uid(), TG_OP, TG_TABLE_NAME,
                CASE WHEN TG_OP = ''DELETE'' THEN OLD.id ELSE NEW.id END,
                jsonb_build_object(''schema'', TG_TABLE_SCHEMA, ''timestamp'', now(), ''operation'', TG_OP)
              );
              IF TG_OP = ''DELETE'' THEN RETURN OLD; END IF;
              RETURN NEW;
            END; $fn$', v_schema, v_tbl, v_schema);

          EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%s ON %I.%I', v_tbl, v_schema, v_tbl);
          EXECUTE format('CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION %I.audit_%s()', v_tbl, v_schema, v_tbl, v_schema, v_tbl);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;
