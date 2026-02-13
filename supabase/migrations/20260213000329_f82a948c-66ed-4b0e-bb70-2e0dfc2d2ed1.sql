
-- =====================================================
-- Storage Isolation لكل Tenant
-- =====================================================

-- 1) جدول إدارة تخزين كل tenant
CREATE TABLE IF NOT EXISTS public.tenant_storage_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  bucket_name text NOT NULL UNIQUE,
  storage_quota_mb int DEFAULT 500,
  used_storage_mb numeric DEFAULT 0,
  encryption_enabled boolean DEFAULT true,
  immutable_snapshots_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_storage_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage storage config"
  ON public.tenant_storage_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission IN ('super_admin', 'admin')));

-- 2) جدول Immutable Snapshots
CREATE TABLE IF NOT EXISTS public.tenant_storage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  snapshot_name text NOT NULL,
  bucket_name text NOT NULL,
  file_paths text[] NOT NULL DEFAULT '{}',
  file_count int DEFAULT 0,
  total_size_bytes bigint DEFAULT 0,
  checksum text,
  is_immutable boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  locked_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_storage_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view snapshots"
  ON public.tenant_storage_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission IN ('super_admin', 'admin')));

CREATE POLICY "System inserts snapshots"
  ON public.tenant_storage_snapshots FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR current_user = 'postgres' OR current_user LIKE 'supabase%');

-- حماية Snapshots من التعديل/الحذف
CREATE OR REPLACE FUNCTION public.protect_immutable_snapshots()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.is_immutable = true THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin') THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
    INSERT INTO security_audit_trail (event_type, severity, tenant_id, details, blocked)
    VALUES ('snapshot_tamper_attempt', 'critical', OLD.tenant_id,
      jsonb_build_object('snapshot_id', OLD.id, 'action', TG_OP), true);
    RAISE EXCEPTION 'Cannot modify immutable snapshot';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_protect_snapshots
  BEFORE UPDATE OR DELETE ON public.tenant_storage_snapshots
  FOR EACH ROW EXECUTE FUNCTION protect_immutable_snapshots();

-- 3) جدول سجل الوصول للملفات
CREATE TABLE IF NOT EXISTS public.storage_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  bucket_name text,
  file_path text,
  operation text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  block_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.storage_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view storage logs"
  ON public.storage_access_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

CREATE POLICY "System inserts storage logs"
  ON public.storage_access_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR current_user = 'postgres' OR current_user LIKE 'supabase%');

CREATE INDEX idx_storage_log_tenant ON public.storage_access_log(tenant_id);
CREATE INDEX idx_storage_log_created ON public.storage_access_log(created_at DESC);

-- 4) دالة إنشاء bucket منفصل لكل tenant
CREATE OR REPLACE FUNCTION public.provision_tenant_storage(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_bucket_name text;
  v_short_id text;
BEGIN
  v_short_id := replace(left(p_company_id::text, 8), '-', '');
  v_bucket_name := 'tenant-' || v_short_id;

  -- إنشاء bucket (private)
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    v_bucket_name, v_bucket_name, false,
    52428800, -- 50MB max per file
    ARRAY['image/jpeg','image/png','image/webp','application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel','text/csv']
  )
  ON CONFLICT (id) DO NOTHING;

  -- تسجيل التهيئة
  INSERT INTO tenant_storage_config (tenant_id, bucket_name)
  VALUES (p_company_id, v_bucket_name)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- RLS policies للـ bucket - كل tenant يرى ملفاته فقط
  -- المجلد الأول = company_id
  RETURN v_bucket_name;
END;
$$;

-- 5) RLS على storage.objects لعزل الملفات
-- SELECT: المستخدم يرى فقط ملفات شركته
CREATE POLICY "Tenant users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id LIKE 'tenant-%'
    AND (storage.foldername(name))[1] = (
      SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
    )
  );

-- INSERT: المستخدم يرفع فقط في مجلد شركته
CREATE POLICY "Tenant users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id LIKE 'tenant-%'
    AND (storage.foldername(name))[1] = (
      SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
    )
  );

-- UPDATE: المستخدم يعدّل فقط ملفات شركته
CREATE POLICY "Tenant users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id LIKE 'tenant-%'
    AND (storage.foldername(name))[1] = (
      SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
    )
  );

-- DELETE: المستخدم يحذف فقط ملفات شركته
CREATE POLICY "Tenant users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id LIKE 'tenant-%'
    AND (storage.foldername(name))[1] = (
      SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
    )
  );

-- 6) تحديث auto-provision ليشمل Storage
CREATE OR REPLACE FUNCTION public.auto_provision_storage()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM provision_tenant_storage(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_storage ON public.companies;
CREATE TRIGGER trg_auto_storage
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION auto_provision_storage();

-- 7) تطبيق على الشركات الحالية
DO $$
DECLARE v_company record;
BEGIN
  FOR v_company IN SELECT id FROM companies LOOP
    PERFORM provision_tenant_storage(v_company.id);
  END LOOP;
END;
$$;
