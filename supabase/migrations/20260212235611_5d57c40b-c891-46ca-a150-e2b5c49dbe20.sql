
-- =====================================================
-- تحديث شامل: إضافة خطوات 11-13 للعزل النهائي
-- =====================================================

-- إزالة Trigger القديم
DROP TRIGGER IF EXISTS trg_provision_company_isolation ON public.companies;

-- 1) دالة منع التعديل على الجداول/البيانات الأساسية (Immutable Baselines)
CREATE OR REPLACE FUNCTION public.prevent_baseline_modification()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- السماح لـ super_admin فقط
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO security_audit_trail (event_type, severity, tenant_id, table_name, operation, details, blocked)
  VALUES (
    'immutable_baseline_violation', 'critical', 
    NULLIF(current_setting('app.current_tenant', true), '')::uuid,
    TG_TABLE_NAME, TG_OP,
    jsonb_build_object('schema', TG_TABLE_SCHEMA, 'attempted_by', current_user),
    true
  );

  RAISE EXCEPTION 'SECURITY: Modification of immutable baseline data is prohibited';
  RETURN NULL;
END;
$$;

-- 2) جدول تسجيل النسخ الاحتياطية لكل tenant
CREATE TABLE IF NOT EXISTS public.tenant_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES companies(id),
  backup_type text NOT NULL DEFAULT 'schema_dump',
  schema_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  file_path text,
  file_size_bytes bigint,
  tables_included text[],
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  initiated_by uuid,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage tenant backups"
  ON public.tenant_backups FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_tenant_backups_tenant ON public.tenant_backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_backups_status ON public.tenant_backups(status);

-- 3) دالة تسجيل طلب backup لكل tenant
CREATE OR REPLACE FUNCTION public.request_tenant_backup(p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_schema text;
  v_backup_id uuid;
  v_tables text[];
BEGIN
  v_schema := 'tenant_' || replace(p_company_id::text, '-', '_');

  -- جمع أسماء الجداول
  SELECT array_agg(table_name) INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = v_schema AND table_type = 'BASE TABLE';

  INSERT INTO tenant_backups (tenant_id, schema_name, status, tables_included, initiated_by)
  VALUES (p_company_id, v_schema, 'pending', v_tables, auth.uid())
  RETURNING id INTO v_backup_id;

  INSERT INTO security_audit_trail (event_type, severity, tenant_id, schema_name, details)
  VALUES ('tenant_backup_requested', 'info', p_company_id, v_schema,
    jsonb_build_object('backup_id', v_backup_id, 'tables', v_tables));

  RETURN v_backup_id;
END;
$$;

-- 4) تحديث دالة التوفير الشاملة مع الخطوات 11-13
CREATE OR REPLACE FUNCTION public.provision_tenant_complete()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tenant_uuid uuid := NEW.id;
  v_schema text;
  v_role_name text;
  v_tbl record;
BEGIN
  v_schema := 'tenant_' || replace(v_tenant_uuid::text, '-', '_');
  v_role_name := 'tenant_role_' || replace(v_tenant_uuid::text, '-', '_');

  -- 2️⃣ توليد AES-256 Key
  IF NOT EXISTS (SELECT 1 FROM company_encryption_keys WHERE company_id = v_tenant_uuid AND is_active = true) THEN
    INSERT INTO company_encryption_keys (company_id, key_hash, key_version, is_active, algorithm)
    VALUES (v_tenant_uuid, encode(gen_random_bytes(32), 'hex'), 1, true, 'aes-256-cbc');
  END IF;

  -- 3️⃣ إنشاء Schema + 12 جدول
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema) THEN
    EXECUTE format('CREATE SCHEMA %I', v_schema);
    EXECUTE format('CREATE TABLE %I.journal_entries (LIKE public.journal_entries INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.journal_entry_lines (LIKE public.journal_entry_lines INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.sales (LIKE public.sales INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.customers (LIKE public.customers INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.suppliers (LIKE public.suppliers INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.cars (LIKE public.cars INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.expenses (LIKE public.expenses INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.account_categories (LIKE public.account_categories INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.fiscal_years (LIKE public.fiscal_years INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.checks (LIKE public.checks INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.custodies (LIKE public.custodies INCLUDING ALL)', v_schema);
    EXECUTE format('CREATE TABLE %I.access_audit_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      operation text NOT NULL, table_name text NOT NULL,
      user_id uuid, db_user text DEFAULT current_user,
      old_data jsonb, new_data jsonb, created_at timestamptz DEFAULT now()
    )', v_schema);
  END IF;

  -- 4️⃣ إنشاء Role معزول
  BEGIN
    EXECUTE format('CREATE ROLE %I NOINHERIT NOLOGIN', v_role_name);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', v_schema, v_role_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', v_schema, v_role_name);
    EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', v_role_name);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- 5️⃣ تفعيل RLS + FORCE RLS + سياسات
  FOR v_tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_tbl.table_name);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v_schema, v_tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_policy_%s ON %I.%I', v_tbl.table_name, v_schema, v_tbl.table_name);
    EXECUTE format(
      'CREATE POLICY tenant_policy_%s ON %I.%I FOR ALL USING (
        current_setting(''app.current_tenant'', true) = %L
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = ''super_admin'')
      )', v_tbl.table_name, v_schema, v_tbl.table_name, v_tenant_uuid::text
    );
  END LOOP;

  -- 6️⃣ حصص الموارد
  INSERT INTO tenant_resource_quotas (tenant_id, max_requests_per_minute, max_storage_mb, max_users)
  VALUES (v_tenant_uuid, 100, 500, 50)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- 7️⃣ حماية Cross-Tenant
  FOR v_tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_cross_tenant_block ON %I.%I', v_schema, v_tbl.table_name);
    EXECUTE format('CREATE TRIGGER trg_cross_tenant_block BEFORE INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION enforce_cross_tenant_block()', v_schema, v_tbl.table_name);
  END LOOP;

  -- 8️⃣ Audit Triggers
  FOR v_tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%s ON %I.%I', v_tbl.table_name, v_schema, v_tbl.table_name);
    EXECUTE format('CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION tenant_audit_trigger_fn()', v_tbl.table_name, v_schema, v_tbl.table_name);
  END LOOP;

  -- 9️⃣ تهيئة التشفير
  INSERT INTO tenant_encryption_config (tenant_id, encrypted_tables, encryption_algorithm, is_active)
  VALUES (v_tenant_uuid, ARRAY['customers','suppliers','sales','checks'], 'aes-256-cbc', true)
  ON CONFLICT (tenant_id) DO UPDATE SET encrypted_tables = EXCLUDED.encrypted_tables, is_active = true;

  -- 🔟 Session Isolation
  EXECUTE format('SET LOCAL app.current_tenant = %L', v_tenant_uuid::text);

  -- 1️⃣1️⃣ Immutable Baselines - حماية account_categories الأساسية
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
  EXCEPTION WHEN undefined_column THEN NULL;
  END;

  -- 1️⃣2️⃣ تسجيل Backup أولي
  INSERT INTO tenant_backups (tenant_id, schema_name, status, tables_included, backup_type)
  SELECT v_tenant_uuid, v_schema, 'initial', array_agg(table_name), 'initial_provision'
  FROM information_schema.tables WHERE table_schema = v_schema AND table_type = 'BASE TABLE';

  -- 1️⃣3️⃣ التحقق الشامل
  PERFORM validate_tenant_complete(v_tenant_uuid);

  -- تسجيل الاكتمال
  INSERT INTO security_audit_trail (event_type, severity, tenant_id, schema_name, details)
  VALUES ('tenant_provisioned_v2', 'info', v_tenant_uuid, v_schema,
    jsonb_build_object('company_name', NEW.name, 'steps_completed', 13));

  RETURN NEW;
END;
$$;

-- إعادة إنشاء الـ Trigger
CREATE TRIGGER trg_provision_company_isolation
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION provision_tenant_complete();
