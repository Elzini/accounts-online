
-- ============================================
-- نظام العزل الهجين: Schema مرآة لكل شركة
-- ============================================

-- 1. دالة إنشاء schema لشركة جديدة مع جداول مرآة
CREATE OR REPLACE FUNCTION public.create_tenant_schema(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
BEGIN
  -- إنشاء اسم schema آمن من company_id
  short_id := replace(p_company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  -- إنشاء الـ schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

  -- إنشاء جداول المرآة للبيانات الحساسة
  -- 1. journal_entries مرآة
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.journal_entries (
      id UUID PRIMARY KEY,
      entry_number INT,
      entry_date DATE,
      description TEXT,
      status TEXT,
      total_debit NUMERIC,
      total_credit NUMERIC,
      reference_type TEXT,
      reference_id TEXT,
      fiscal_year_id UUID,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
      synced_at TIMESTAMPTZ DEFAULT now()
    )', schema_name);

  -- 2. journal_entry_lines مرآة
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.journal_entry_lines (
      id UUID PRIMARY KEY,
      journal_entry_id UUID,
      account_id UUID,
      account_code TEXT,
      account_name TEXT,
      description TEXT,
      debit NUMERIC DEFAULT 0,
      credit NUMERIC DEFAULT 0,
      cost_center_id UUID,
      synced_at TIMESTAMPTZ DEFAULT now()
    )', schema_name);

  -- 3. account_categories مرآة
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.account_categories (
      id UUID PRIMARY KEY,
      code TEXT,
      name TEXT,
      type TEXT,
      parent_id UUID,
      description TEXT,
      is_system BOOLEAN,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
      synced_at TIMESTAMPTZ DEFAULT now()
    )', schema_name);

  -- 4. vouchers مرآة
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.vouchers (
      id UUID PRIMARY KEY,
      voucher_number TEXT,
      voucher_type TEXT,
      amount NUMERIC,
      description TEXT,
      payment_date DATE,
      status TEXT,
      created_at TIMESTAMPTZ,
      synced_at TIMESTAMPTZ DEFAULT now()
    )', schema_name);

  -- 5. سجل التدقيق الخاص بالشركة
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.access_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      action TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id UUID,
      ip_address TEXT,
      user_agent TEXT,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    )', schema_name);

  -- تسجيل إنشاء الـ schema
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, company_id, new_data
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'TENANT_SCHEMA_CREATED',
    'company',
    p_company_id::text,
    p_company_id,
    jsonb_build_object('schema_name', schema_name, 'created_at', now())
  );
END;
$$;

-- 2. دالة مزامنة القيود إلى schema الشركة
CREATE OR REPLACE FUNCTION public.sync_journal_entry_to_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
BEGIN
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  short_id := replace(NEW.company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  -- تحقق من وجود الـ schema
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = schema_name) THEN
    PERFORM create_tenant_schema(NEW.company_id);
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    EXECUTE format('
      INSERT INTO %I.journal_entries (id, entry_number, entry_date, description, status, total_debit, total_credit, reference_type, reference_id, fiscal_year_id, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      ON CONFLICT (id) DO UPDATE SET
        entry_number = EXCLUDED.entry_number,
        entry_date = EXCLUDED.entry_date,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        total_debit = EXCLUDED.total_debit,
        total_credit = EXCLUDED.total_credit,
        reference_type = EXCLUDED.reference_type,
        reference_id = EXCLUDED.reference_id,
        synced_at = now()
    ', schema_name)
    USING NEW.id, NEW.entry_number, NEW.entry_date, NEW.description, NEW.status, NEW.total_debit, NEW.total_credit, NEW.reference_type, NEW.reference_id, NEW.fiscal_year_id, NEW.created_at, NEW.updated_at;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    EXECUTE format('DELETE FROM %I.journal_entries WHERE id = $1', schema_name) USING OLD.id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. دالة مزامنة سطور القيود
CREATE OR REPLACE FUNCTION public.sync_journal_line_to_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
  v_company_id UUID;
  v_account_code TEXT;
  v_account_name TEXT;
BEGIN
  -- جلب company_id من القيد الأب
  SELECT company_id INTO v_company_id FROM public.journal_entries WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  IF v_company_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  short_id := replace(v_company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- جلب بيانات الحساب
    SELECT code, name INTO v_account_code, v_account_name FROM public.account_categories WHERE id = NEW.account_id;

    EXECUTE format('
      INSERT INTO %I.journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, description, debit, credit, cost_center_id, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      ON CONFLICT (id) DO UPDATE SET
        account_id = EXCLUDED.account_id,
        account_code = EXCLUDED.account_code,
        account_name = EXCLUDED.account_name,
        description = EXCLUDED.description,
        debit = EXCLUDED.debit,
        credit = EXCLUDED.credit,
        synced_at = now()
    ', schema_name)
    USING NEW.id, NEW.journal_entry_id, NEW.account_id, v_account_code, v_account_name, NEW.description, NEW.debit, NEW.credit, NEW.cost_center_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    EXECUTE format('DELETE FROM %I.journal_entry_lines WHERE id = $1', schema_name) USING OLD.id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. دالة مزامنة شجرة الحسابات
CREATE OR REPLACE FUNCTION public.sync_account_to_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
BEGIN
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  short_id := replace(NEW.company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = schema_name) THEN
    PERFORM create_tenant_schema(NEW.company_id);
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    EXECUTE format('
      INSERT INTO %I.account_categories (id, code, name, type, parent_id, description, is_system, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        parent_id = EXCLUDED.parent_id,
        description = EXCLUDED.description,
        synced_at = now()
    ', schema_name)
    USING NEW.id, NEW.code, NEW.name, NEW.type, NEW.parent_id, NEW.description, NEW.is_system, NEW.created_at, NEW.updated_at;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    EXECUTE format('DELETE FROM %I.account_categories WHERE id = $1', schema_name) USING OLD.id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Trigger تلقائي عند إنشاء شركة جديدة
CREATE OR REPLACE FUNCTION public.auto_create_tenant_schema()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_tenant_schema(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_tenant_schema ON public.companies;
CREATE TRIGGER trg_auto_create_tenant_schema
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_tenant_schema();

-- 6. Triggers المزامنة على الجداول الحساسة
DROP TRIGGER IF EXISTS trg_sync_journal_entry ON public.journal_entries;
CREATE TRIGGER trg_sync_journal_entry
  AFTER INSERT OR UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_journal_entry_to_tenant();

DROP TRIGGER IF EXISTS trg_sync_journal_line ON public.journal_entry_lines;
CREATE TRIGGER trg_sync_journal_line
  AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_journal_line_to_tenant();

DROP TRIGGER IF EXISTS trg_sync_account ON public.account_categories;
CREATE TRIGGER trg_sync_account
  AFTER INSERT OR UPDATE OR DELETE ON public.account_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_account_to_tenant();

-- 7. دالة التحقق من تطابق البيانات بين public و tenant schema
CREATE OR REPLACE FUNCTION public.verify_tenant_data_integrity(p_company_id UUID)
RETURNS TABLE(
  table_name TEXT,
  public_count BIGINT,
  tenant_count BIGINT,
  is_matching BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
  pub_count BIGINT;
  ten_count BIGINT;
BEGIN
  short_id := replace(p_company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  -- التحقق من journal_entries
  SELECT count(*) INTO pub_count FROM public.journal_entries WHERE company_id = p_company_id;
  EXECUTE format('SELECT count(*) FROM %I.journal_entries', schema_name) INTO ten_count;
  table_name := 'journal_entries'; public_count := pub_count; tenant_count := ten_count; is_matching := (pub_count = ten_count);
  RETURN NEXT;

  -- التحقق من account_categories
  SELECT count(*) INTO pub_count FROM public.account_categories WHERE company_id = p_company_id;
  EXECUTE format('SELECT count(*) FROM %I.account_categories', schema_name) INTO ten_count;
  table_name := 'account_categories'; public_count := pub_count; tenant_count := ten_count; is_matching := (pub_count = ten_count);
  RETURN NEXT;

  RETURN;
END;
$$;

-- 8. دالة لمزامنة البيانات الموجودة مسبقاً لشركة
CREATE OR REPLACE FUNCTION public.backfill_tenant_schema(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
  rec RECORD;
BEGIN
  short_id := replace(p_company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  -- إنشاء الـ schema إذا لم يكن موجوداً
  PERFORM create_tenant_schema(p_company_id);

  -- مزامنة شجرة الحسابات
  FOR rec IN SELECT * FROM public.account_categories WHERE company_id = p_company_id LOOP
    EXECUTE format('
      INSERT INTO %I.account_categories (id, code, name, type, parent_id, description, is_system, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      ON CONFLICT (id) DO NOTHING
    ', schema_name)
    USING rec.id, rec.code, rec.name, rec.type, rec.parent_id, rec.description, rec.is_system, rec.created_at, rec.updated_at;
  END LOOP;

  -- مزامنة القيود
  FOR rec IN SELECT * FROM public.journal_entries WHERE company_id = p_company_id LOOP
    EXECUTE format('
      INSERT INTO %I.journal_entries (id, entry_number, entry_date, description, status, total_debit, total_credit, reference_type, reference_id, fiscal_year_id, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      ON CONFLICT (id) DO NOTHING
    ', schema_name)
    USING rec.id, rec.entry_number, rec.entry_date, rec.description, rec.status, rec.total_debit, rec.total_credit, rec.reference_type, rec.reference_id, rec.fiscal_year_id, rec.created_at, rec.updated_at;
  END LOOP;

  -- مزامنة سطور القيود
  FOR rec IN 
    SELECT jel.*, ac.code as account_code, ac.name as account_name
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    LEFT JOIN public.account_categories ac ON jel.account_id = ac.id
    WHERE je.company_id = p_company_id
  LOOP
    EXECUTE format('
      INSERT INTO %I.journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, description, debit, credit, cost_center_id, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      ON CONFLICT (id) DO NOTHING
    ', schema_name)
    USING rec.id, rec.journal_entry_id, rec.account_id, rec.account_code, rec.account_name, rec.description, rec.debit, rec.credit, rec.cost_center_id;
  END LOOP;
END;
$$;
