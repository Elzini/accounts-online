-- =====================================================
-- تعزيز أمان النظام - إنشاء دوال الأمان
-- =====================================================

-- 1. دالة محسّنة للتحقق من انتماء المستخدم للشركة مع تحقق إضافي
CREATE OR REPLACE FUNCTION public.secure_belongs_to_company(
  _user_id uuid,
  _company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.company_id = _company_id
      AND EXISTS (
        SELECT 1 FROM public.companies c 
        WHERE c.id = _company_id 
        AND c.is_active = true
      )
  )
$$;

-- 2. دالة للتحقق من الصلاحيات مع التحقق من الشركة
CREATE OR REPLACE FUNCTION public.secure_has_permission(
  _permission public.user_permission
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.profiles p ON ur.user_id = p.user_id
    INNER JOIN public.companies c ON p.company_id = c.id
    WHERE ur.user_id = auth.uid()
      AND ur.permission = _permission
      AND c.is_active = true
  )
$$;

-- 3. دالة للتحقق من أن المستخدم لديه صلاحية على شركته فقط
CREATE OR REPLACE FUNCTION public.can_access_company_data(
  _company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.secure_belongs_to_company(auth.uid(), _company_id)
$$;

-- 4. دالة للحصول على company_id للمستخدم الحالي بشكل آمن
CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.company_id
  FROM public.profiles p
  INNER JOIN public.companies c ON p.company_id = c.id
  WHERE p.user_id = auth.uid()
    AND c.is_active = true
  LIMIT 1
$$;