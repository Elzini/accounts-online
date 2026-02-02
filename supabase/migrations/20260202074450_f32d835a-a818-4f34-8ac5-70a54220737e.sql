
-- Update the initialize_company_defaults function to include fixed asset accounts
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
RETURNS TRIGGER AS $$
DECLARE
  template_row RECORD;
  parent_map JSONB := '{}'::JSONB;
  new_account_id UUID;
  parent_account_id UUID;
BEGIN
  -- Copy accounts from COA templates based on company type
  FOR template_row IN 
    SELECT * FROM public.coa_templates 
    WHERE company_type = NEW.company_type
    ORDER BY code
  LOOP
    -- Find parent_id from the map
    parent_account_id := NULL;
    IF template_row.parent_code IS NOT NULL THEN
      parent_account_id := (parent_map->>template_row.parent_code)::UUID;
    END IF;
    
    -- Insert the account
    INSERT INTO public.account_categories (
      company_id,
      code,
      name,
      type,
      parent_id,
      is_system
    ) VALUES (
      NEW.id,
      template_row.code,
      template_row.name,
      template_row.type,
      parent_account_id,
      true
    )
    RETURNING id INTO new_account_id;
    
    -- Store in map for child lookups
    parent_map := parent_map || jsonb_build_object(template_row.code, new_account_id::text);
  END LOOP;
  
  -- Ensure fixed asset accounts exist (in case not in template)
  INSERT INTO public.account_categories (company_id, code, name, type, is_system)
  SELECT NEW.id, code, name, type, true
  FROM (VALUES
    ('1300', 'الأصول الثابتة', 'assets'),
    ('1310', 'السيارات', 'assets'),
    ('1320', 'المعدات والآلات', 'assets'),
    ('1330', 'الأثاث المكتبي', 'assets'),
    ('1340', 'أجهزة الكمبيوتر والتقنية', 'assets'),
    ('1350', 'الأصول غير الملموسة - البرامج', 'assets'),
    ('1390', 'مجمع إهلاك الأصول الثابتة', 'assets'),
    ('5401', 'مصروفات الإهلاك', 'expenses')
  ) AS v(code, name, type)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.account_categories 
    WHERE company_id = NEW.id AND code = v.code
  );
  
  -- Initialize company accounting settings
  INSERT INTO public.company_accounting_settings (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  
  -- Copy default settings for new company
  INSERT INTO public.app_settings (company_id, key, value)
  SELECT NEW.id, setting_key, setting_value
  FROM public.default_company_settings
  WHERE setting_type IN ('app', 'invoice', 'menu')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_company_defaults();
