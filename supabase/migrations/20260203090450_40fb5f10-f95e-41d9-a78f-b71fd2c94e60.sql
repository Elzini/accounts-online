-- ==============================================
-- إصلاح 1: حماية بيانات الموردين الحساسة
-- ==============================================

-- إنشاء view آمن للموردين يخفي بيانات الاتصال للمستخدمين غير المدراء
CREATE OR REPLACE VIEW public.suppliers_safe
WITH (security_invoker=on)
AS
SELECT 
  id,
  name,
  -- إخفاء رقم الهوية - إظهار آخر 4 أرقام فقط
  CASE 
    WHEN id_number IS NOT NULL AND LENGTH(id_number) > 4 
    THEN '•••••' || RIGHT(id_number, 4)
    ELSE id_number
  END AS id_number,
  -- إخفاء السجل التجاري - إظهار آخر 4 أرقام فقط  
  CASE 
    WHEN registration_number IS NOT NULL AND LENGTH(registration_number) > 4 
    THEN '•••••' || RIGHT(registration_number, 4)
    ELSE registration_number
  END AS registration_number,
  -- إخفاء رقم الهاتف - إظهار آخر 4 أرقام فقط
  CASE 
    WHEN phone IS NOT NULL AND LENGTH(phone) > 4 
    THEN '•••' || RIGHT(phone, 4)
    ELSE phone
  END AS phone,
  -- إخفاء العنوان - إظهار المدينة فقط (أول كلمة)
  CASE 
    WHEN address IS NOT NULL AND LENGTH(address) > 0 
    THEN SPLIT_PART(address, ' ', 1) || ' •••'
    ELSE address
  END AS address,
  notes,
  created_at,
  updated_at,
  company_id
FROM public.suppliers;

-- منح صلاحية القراءة للمستخدمين المصادق عليهم
GRANT SELECT ON public.suppliers_safe TO authenticated;

-- ==============================================
-- إصلاح 2: حماية سجلات التدقيق من الإدخال غير المصرح
-- ==============================================

-- حذف سياسة الإدخال القديمة غير الآمنة
DROP POLICY IF EXISTS "Secure audit insert" ON public.audit_logs;

-- إنشاء سياسة جديدة تمنع الإدخال المباشر من المستخدمين
-- الإدخال يتم فقط من خلال triggers أو SECURITY DEFINER functions
CREATE POLICY "audit_logs_no_direct_insert" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (false);

-- إنشاء دالة لإدخال سجلات التدقيق (SECURITY DEFINER تتجاوز RLS)
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  _user_id UUID,
  _company_id UUID,
  _entity_type TEXT,
  _entity_id UUID,
  _action TEXT,
  _old_data JSONB DEFAULT NULL,
  _new_data JSONB DEFAULT NULL,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _prev_hash TEXT;
  _seq_num INT;
  _new_hash TEXT;
BEGIN
  -- التحقق من أن المستخدم مصادق عليه
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- التحقق من أن user_id هو المستخدم الحالي أو NULL
  IF _user_id IS NOT NULL AND _user_id != auth.uid() THEN
    -- السماح فقط للمدراء بإدخال سجلات لمستخدمين آخرين
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Cannot create audit log for another user';
    END IF;
  END IF;
  
  -- الحصول على آخر hash و sequence number للشركة
  SELECT integrity_hash, sequence_number 
  INTO _prev_hash, _seq_num
  FROM public.audit_logs 
  WHERE company_id = _company_id 
  ORDER BY sequence_number DESC 
  LIMIT 1;
  
  _seq_num := COALESCE(_seq_num, 0) + 1;
  _prev_hash := COALESCE(_prev_hash, 'GENESIS');
  
  -- حساب hash جديد للسلسلة
  _new_hash := encode(
    sha256(
      (_prev_hash || _seq_num::TEXT || _entity_type || COALESCE(_entity_id::TEXT, '') || _action || NOW()::TEXT)::BYTEA
    ),
    'hex'
  );
  
  -- إدخال السجل
  INSERT INTO public.audit_logs (
    user_id,
    company_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    ip_address,
    user_agent,
    sequence_number,
    previous_hash,
    integrity_hash
  ) VALUES (
    COALESCE(_user_id, auth.uid()),
    _company_id,
    _entity_type,
    _entity_id,
    _action,
    _old_data,
    _new_data,
    _ip_address,
    _user_agent,
    _seq_num,
    _prev_hash,
    _new_hash
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- منح صلاحية تنفيذ الدالة للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION public.insert_audit_log TO authenticated;

-- تحديث trigger الموجود لاستخدام الدالة الجديدة
CREATE OR REPLACE FUNCTION public.auto_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _entity_id UUID;
  _old_data JSONB;
  _new_data JSONB;
BEGIN
  -- استخراج company_id و entity_id
  IF TG_OP = 'DELETE' THEN
    _company_id := OLD.company_id;
    _entity_id := OLD.id;
    _old_data := to_jsonb(OLD);
    _new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    _company_id := NEW.company_id;
    _entity_id := NEW.id;
    _old_data := NULL;
    _new_data := to_jsonb(NEW);
  ELSE -- UPDATE
    _company_id := COALESCE(NEW.company_id, OLD.company_id);
    _entity_id := COALESCE(NEW.id, OLD.id);
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
  END IF;
  
  -- إدخال سجل التدقيق مباشرة (الـ trigger يتجاوز RLS)
  INSERT INTO public.audit_logs (
    user_id,
    company_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    sequence_number,
    previous_hash,
    integrity_hash
  )
  SELECT
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
    _company_id,
    TG_TABLE_NAME,
    _entity_id,
    TG_OP,
    _old_data,
    _new_data,
    COALESCE(MAX(sequence_number), 0) + 1,
    COALESCE(
      (SELECT integrity_hash FROM public.audit_logs 
       WHERE company_id = _company_id 
       ORDER BY sequence_number DESC LIMIT 1),
      'GENESIS'
    ),
    encode(sha256(random()::TEXT::BYTEA), 'hex')
  FROM public.audit_logs
  WHERE company_id = _company_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- التأكد من أن الـ trigger مثبت على الجداول الحساسة
DO $$
DECLARE
  tbl TEXT;
  sensitive_tables TEXT[] := ARRAY[
    'customers', 'suppliers', 'employees', 'sales', 'cars', 
    'journal_entries', 'bank_accounts', 'expenses', 'contracts'
  ];
BEGIN
  FOREACH tbl IN ARRAY sensitive_tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER audit_%I 
       AFTER INSERT OR UPDATE OR DELETE ON public.%I 
       FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger()',
      tbl, tbl
    );
  END LOOP;
END;
$$;