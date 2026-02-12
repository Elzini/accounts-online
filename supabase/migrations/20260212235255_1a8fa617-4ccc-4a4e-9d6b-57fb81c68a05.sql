
-- =====================================================
-- تحديث دالة التوفير الشامل بناءً على طلب المستخدم
-- مع التوافق مع البنية الحالية (companies.id = UUID)
-- =====================================================

-- إزالة الـ triggers القديمة
DROP TRIGGER IF EXISTS trg_auto_provision_final ON public.companies;
DROP TRIGGER IF EXISTS trg_auto_provision ON public.companies;
DROP TRIGGER IF EXISTS trg_provision_company_isolation ON public.companies;

-- الدالة الشاملة المحدّثة
CREATE OR REPLACE FUNCTION public.provision_tenant_complete()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tenant_uuid uuid := NEW.id;
  v_schema text;
  v_role_name text;
  v_tbl record;
  v_password text;
BEGIN
  v_schema := 'tenant_' || replace(v_tenant_uuid::text, '-', '_');
  v_role_name := 'tenant_role_' || replace(v_tenant_uuid::text, '-', '_');

  -- ============================================
  -- 2️⃣ توليد AES-256 Key لكل tenant
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM company_encryption_keys WHERE company_id = v_tenant_uuid AND is_active = true) THEN
    INSERT INTO company_encryption_keys (company_id, key_hash, key_version, is_active, algorithm)
    VALUES (v_tenant_uuid, encode(gen_random_bytes(32), 'hex'), 1, true, 'aes-256-cbc');
  END IF;

  -- ============================================
  -- 3️⃣ إنشاء Schema مستقل + 12 جدول
  -- ============================================
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
      operation text NOT NULL,
      table_name text NOT NULL,
      user_id uuid,
      db_user text DEFAULT current_user,
      old_data jsonb,
      new_data jsonb,
      created_at timestamptz DEFAULT now()
    )', v_schema);
  END IF;

  -- ============================================
  -- 4️⃣ إنشاء PostgreSQL Role معزول
  -- ============================================
  BEGIN
    v_password := gen_random_uuid()::text;
    EXECUTE format('CREATE ROLE %I NOINHERIT NOLOGIN', v_role_name);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', v_schema, v_role_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', v_schema, v_role_name);
    EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', v_role_name);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- ============================================
  -- 5️⃣ تفعيل RLS على جميع الجداول الحساسة
  -- ============================================
  FOR v_tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = v_schema AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_tbl.table_name);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v_schema, v_tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_policy_%s ON %I.%I', v_tbl.table_name, v_schema, v_tbl.table_name);
    EXECUTE format(
      'CREATE POLICY tenant_policy_%s ON %I.%I FOR ALL USING (
        current_setting(''app.current_tenant'', true) = %L
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = ''super_admin'')
      )',
      v_tbl.table_name, v_schema, v_tbl.table_name, v_tenant_uuid::text
    );
  END LOOP;

  -- ============================================
  -- 6️⃣ تعيين حصص الموارد لكل tenant
  -- ============================================
  INSERT INTO tenant_resource_quotas (tenant_id, max_requests_per_minute, max_storage_mb, max_users)
  VALUES (v_tenant_uuid, 100, 500, 50)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- ============================================
  -- 7️⃣ تفعيل حماية Cross-Tenant
  -- ============================================
  FOR v_tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = v_schema AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_cross_tenant_block ON %I.%I', v_schema, v_tbl.table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_cross_tenant_block
       BEFORE INSERT OR UPDATE OR DELETE ON %I.%I
       FOR EACH ROW EXECUTE FUNCTION enforce_cross_tenant_block()',
      v_schema, v_tbl.table_name
    );
  END LOOP;

  -- ============================================
  -- 8️⃣ تركيب Audit Triggers على جميع الجداول الحساسة
  -- ============================================
  FOR v_tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = v_schema AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%s ON %I.%I', v_tbl.table_name, v_schema, v_tbl.table_name);
    EXECUTE format(
      'CREATE TRIGGER audit_%s
       AFTER INSERT OR UPDATE OR DELETE ON %I.%I
       FOR EACH ROW EXECUTE FUNCTION tenant_audit_trigger_fn()',
      v_tbl.table_name, v_schema, v_tbl.table_name
    );
  END LOOP;

  -- ============================================
  -- 9️⃣ إعداد تشفير الأعمدة الحساسة
  -- ============================================
  INSERT INTO tenant_encryption_config (tenant_id, encrypted_tables, encryption_algorithm, is_active)
  VALUES (v_tenant_uuid, ARRAY['customers','suppliers','sales','checks'], 'aes-256-cbc', true)
  ON CONFLICT (tenant_id) DO UPDATE SET encrypted_tables = EXCLUDED.encrypted_tables, is_active = true;

  -- ============================================
  -- 🔟 التحقق الشامل
  -- ============================================
  PERFORM validate_tenant_complete(v_tenant_uuid);

  -- تسجيل الحدث
  INSERT INTO security_audit_trail (event_type, severity, tenant_id, schema_name, details)
  VALUES ('tenant_provisioned', 'info', v_tenant_uuid, v_schema, 
    jsonb_build_object('company_name', NEW.name, 'steps_completed', 10));

  RETURN NEW;
END;
$$;

-- ============================================
-- Trigger على جدول companies لتشغيل الدالة تلقائياً
-- ============================================
CREATE TRIGGER trg_provision_company_isolation
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION provision_tenant_complete();
