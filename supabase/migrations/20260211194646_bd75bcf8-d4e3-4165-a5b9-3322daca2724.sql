
-- ===========================================
-- ISOL-003: تشفير مستقل لكل شركة (Per-Tenant Encryption Keys)
-- ===========================================

-- 1. جدول مفاتيح التشفير لكل شركة
CREATE TABLE IF NOT EXISTS public.company_encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_version integer NOT NULL DEFAULT 1,
  algorithm text NOT NULL DEFAULT 'aes-256-gcm',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  created_by uuid
);

-- تفعيل RLS
ALTER TABLE public.company_encryption_keys ENABLE ROW LEVEL SECURITY;

-- سياسة: لا أحد يقرأ مباشرة (فقط عبر دوال security definer)
CREATE POLICY "No direct access to encryption keys"
  ON public.company_encryption_keys FOR SELECT
  USING (false);

CREATE POLICY "No direct insert to encryption keys"
  ON public.company_encryption_keys FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update to encryption keys"
  ON public.company_encryption_keys FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete to encryption keys"
  ON public.company_encryption_keys FOR DELETE
  USING (false);

-- 2. دالة لإنشاء مفتاح تشفير لشركة جديدة تلقائياً
CREATE OR REPLACE FUNCTION public.generate_company_encryption_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_encryption_keys (company_id, key_hash, created_by)
  VALUES (
    NEW.id,
    encode(gen_random_bytes(32), 'hex'),
    auth.uid()
  );
  RETURN NEW;
END;
$$;

-- 3. تطبيق trigger على جدول الشركات
DROP TRIGGER IF EXISTS auto_generate_encryption_key ON public.companies;
CREATE TRIGGER auto_generate_encryption_key
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_company_encryption_key();

-- 4. دالة تشفير البيانات بمفتاح الشركة
CREATE OR REPLACE FUNCTION public.encrypt_tenant_data(_company_id uuid, _plaintext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _key text;
  _iv bytea;
  _encrypted bytea;
BEGIN
  SELECT key_hash INTO _key
  FROM public.company_encryption_keys
  WHERE company_id = _company_id AND is_active = true
  ORDER BY key_version DESC LIMIT 1;
  
  IF _key IS NULL THEN
    RAISE EXCEPTION 'No encryption key found for company %', _company_id;
  END IF;
  
  _iv := gen_random_bytes(16);
  _encrypted := encrypt_iv(
    convert_to(_plaintext, 'utf8'),
    decode(_key, 'hex'),
    _iv,
    'aes'
  );
  
  RETURN encode(_iv || _encrypted, 'base64');
END;
$$;

-- 5. دالة فك تشفير البيانات بمفتاح الشركة
CREATE OR REPLACE FUNCTION public.decrypt_tenant_data(_company_id uuid, _ciphertext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _key text;
  _raw bytea;
  _iv bytea;
  _encrypted bytea;
BEGIN
  SELECT key_hash INTO _key
  FROM public.company_encryption_keys
  WHERE company_id = _company_id AND is_active = true
  ORDER BY key_version DESC LIMIT 1;
  
  IF _key IS NULL THEN
    RAISE EXCEPTION 'No encryption key found for company %', _company_id;
  END IF;
  
  _raw := decode(_ciphertext, 'base64');
  _iv := substring(_raw from 1 for 16);
  _encrypted := substring(_raw from 17);
  
  RETURN convert_from(
    decrypt_iv(_encrypted, decode(_key, 'hex'), _iv, 'aes'),
    'utf8'
  );
END;
$$;

-- 6. دالة تدوير مفتاح التشفير
CREATE OR REPLACE FUNCTION public.rotate_company_encryption_key(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_version integer;
BEGIN
  -- التحقق من الصلاحية
  IF NOT public.verify_user_company_access(auth.uid(), _company_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT COALESCE(MAX(key_version), 0) INTO _current_version
  FROM public.company_encryption_keys
  WHERE company_id = _company_id;
  
  -- تعطيل المفتاح القديم
  UPDATE public.company_encryption_keys
  SET is_active = false, rotated_at = now()
  WHERE company_id = _company_id AND is_active = true;
  
  -- إنشاء مفتاح جديد
  INSERT INTO public.company_encryption_keys (company_id, key_hash, key_version, created_by)
  VALUES (
    _company_id,
    encode(gen_random_bytes(32), 'hex'),
    _current_version + 1,
    auth.uid()
  );
  
  -- تسجيل في audit
  INSERT INTO public.audit_logs (user_id, company_id, entity_type, action, new_data)
  VALUES (
    auth.uid()::text, _company_id::text, 'encryption_key',
    'key_rotation',
    jsonb_build_object('new_version', _current_version + 1)
  );
END;
$$;

-- 7. إنشاء مفاتيح للشركات الموجودة حالياً
INSERT INTO public.company_encryption_keys (company_id, key_hash)
SELECT c.id, encode(gen_random_bytes(32), 'hex')
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_encryption_keys ek WHERE ek.company_id = c.id
);

-- ===========================================
-- ISOL-002: Rate Limiting Table
-- ===========================================

-- جدول لتتبع معدل الطلبات لكل شركة
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to rate limits"
  ON public.rate_limit_log FOR ALL
  USING (false);

-- فهرس للاستعلام السريع
CREATE INDEX IF NOT EXISTS idx_rate_limit_company_window
  ON public.rate_limit_log (company_id, endpoint, window_start);

-- دالة للتحقق من Rate Limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _company_id uuid,
  _endpoint text,
  _max_requests integer DEFAULT 100,
  _window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
  _window_start timestamptz;
BEGIN
  _window_start := now() - (_window_seconds || ' seconds')::interval;
  
  SELECT COALESCE(SUM(request_count), 0) INTO _count
  FROM public.rate_limit_log
  WHERE company_id = _company_id
    AND endpoint = _endpoint
    AND window_start >= _window_start;
  
  IF _count >= _max_requests THEN
    -- تسجيل تجاوز الحد
    INSERT INTO public.audit_logs (user_id, company_id, entity_type, action, new_data)
    VALUES (
      COALESCE(auth.uid()::text, 'system'), _company_id::text,
      'rate_limit', 'limit_exceeded',
      jsonb_build_object('endpoint', _endpoint, 'count', _count, 'limit', _max_requests)
    );
    RETURN false;
  END IF;
  
  -- تسجيل الطلب
  INSERT INTO public.rate_limit_log (company_id, endpoint, window_start)
  VALUES (_company_id, _endpoint, now());
  
  RETURN true;
END;
$$;

-- تنظيف تلقائي للسجلات القديمة
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - interval '1 hour';
END;
$$;
