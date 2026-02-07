
-- ============================================================
-- إصلاح تكرارات الـ Triggers وصلاحيات جدول profiles
-- ============================================================

-- 1. إضافة صلاحيات GRANT لجدول profiles (السبب الرئيسي لخطأ permission denied)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 2. إزالة trigger تكرار إنشاء الشركة من profiles
-- handle_new_user على auth.users يقوم بكل شيء: إنشاء شركة + profile + صلاحيات
-- لذلك create_company_for_new_user على profiles يكرّر العمل ويُنشئ شركة ثانية!
DROP TRIGGER IF EXISTS on_profile_created_create_company ON public.profiles;

-- 3. إزالة trigger تكرار إعطاء الصلاحيات
-- handle_new_user يعطي admin بالفعل
-- make_first_user_admin يكرر نفس الصلاحيات
DROP TRIGGER IF EXISTS on_first_user_make_admin ON public.profiles;

-- 4. إزالة triggers تكرار إنشاء شجرة الحسابات
-- هناك 3 triggers تحاول إنشاء COA عند إنشاء شركة:
-- a) initialize_company_defaults_trigger → initialize_company_defaults()
-- b) on_company_created → initialize_company_defaults() (نفس الدالة مكررة!)
-- c) on_company_created_init_coa → initialize_company_coa_from_template()
-- نحتفظ فقط بواحد: initialize_company_defaults_trigger

DROP TRIGGER IF EXISTS on_company_created_init_coa ON public.companies;
DROP TRIGGER IF EXISTS on_company_created ON public.companies;

-- 5. إصلاح دالة handle_new_user لتكون أكثر أماناً
-- التأكد من عدم إنشاء شركة مكررة إذا كانت موجودة
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
  company_name_from_meta text;
  phone_from_meta text;
  existing_profile_id uuid;
BEGIN
  -- Check if profile already exists (prevent duplicate)
  SELECT id INTO existing_profile_id FROM public.profiles WHERE user_id = new.id;
  IF existing_profile_id IS NOT NULL THEN
    RETURN new;
  END IF;

  -- Get company name and phone from user metadata
  company_name_from_meta := COALESCE(new.raw_user_meta_data ->> 'username', 'شركة جديدة');
  phone_from_meta := new.raw_user_meta_data ->> 'phone';
  
  -- Create a new company for this user
  INSERT INTO public.companies (name, phone)
  VALUES (company_name_from_meta, phone_from_meta)
  RETURNING id INTO new_company_id;
  
  -- Create user profile linked to the new company
  INSERT INTO public.profiles (user_id, username, company_id)
  VALUES (new.id, company_name_from_meta, new_company_id);
  
  -- Give the user all necessary permissions
  INSERT INTO public.user_roles (user_id, permission)
  VALUES 
    (new.id, 'admin'),
    (new.id, 'sales'),
    (new.id, 'purchases'),
    (new.id, 'reports'),
    (new.id, 'users')
  ON CONFLICT DO NOTHING;
  
  RETURN new;
END;
$$;

-- 6. إصلاح دالة initialize_company_defaults لتكون idempotent (تمنع التكرار)
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_row RECORD;
  parent_map JSONB := '{}'::JSONB;
  new_account_id UUID;
  parent_account_id UUID;
  existing_count INTEGER;
BEGIN
  -- Check if accounts already exist for this company (prevent duplicate initialization)
  SELECT COUNT(*) INTO existing_count FROM public.account_categories WHERE company_id = NEW.id;
  IF existing_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Copy accounts from COA templates based on company type
  FOR template_row IN 
    SELECT * FROM public.coa_templates 
    WHERE company_type = COALESCE(NEW.company_type, 'car_dealership')
    ORDER BY sort_order NULLS LAST, code
  LOOP
    -- Resolve parent_id
    parent_account_id := NULL;
    IF template_row.parent_code IS NOT NULL THEN
      parent_account_id := (parent_map ->> template_row.parent_code)::UUID;
    END IF;
    
    -- Insert account
    INSERT INTO public.account_categories (
      company_id, code, name, type, parent_id, is_system
    ) VALUES (
      NEW.id, 
      template_row.code, 
      template_row.name, 
      template_row.type, 
      parent_account_id, 
      COALESCE(template_row.is_header, false)
    )
    ON CONFLICT (company_id, code) DO NOTHING
    RETURNING id INTO new_account_id;
    
    -- If insert succeeded, add to parent map
    IF new_account_id IS NOT NULL THEN
      parent_map := parent_map || jsonb_build_object(template_row.code, new_account_id::text);
    ELSE
      -- Get existing account id for parent mapping
      SELECT id INTO new_account_id FROM public.account_categories 
      WHERE company_id = NEW.id AND code = template_row.code;
      IF new_account_id IS NOT NULL THEN
        parent_map := parent_map || jsonb_build_object(template_row.code, new_account_id::text);
      END IF;
    END IF;
  END LOOP;

  -- Create default accounting settings
  INSERT INTO public.company_accounting_settings (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;

  -- Create default tax settings
  INSERT INTO public.tax_settings (company_id, tax_name, tax_rate, is_active, apply_to_sales, apply_to_purchases)
  VALUES (NEW.id, 'ضريبة القيمة المضافة', 15.00, false, true, true)
  ON CONFLICT (company_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 7. حذف الشركات المكررة (اليتيمة) - شركات بدون profiles مرتبطة بها
-- أولاً نتحقق من وجود شركات يتيمة ونحذفها
DELETE FROM public.companies 
WHERE id NOT IN (SELECT DISTINCT company_id FROM public.profiles WHERE company_id IS NOT NULL)
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.company_id = companies.id);
