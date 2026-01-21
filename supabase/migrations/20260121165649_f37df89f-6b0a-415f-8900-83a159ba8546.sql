
-- Update the initialize_company_defaults function to apply ALL default settings
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_setting RECORD;
  v_default_invoice_settings jsonb;
  v_tax_name text;
  v_tax_rate numeric;
  v_tax_active boolean;
  v_apply_to_sales boolean;
  v_apply_to_purchases boolean;
  v_auto_journal_enabled boolean;
  v_auto_sales_entries boolean;
  v_auto_purchase_entries boolean;
  v_auto_expense_entries boolean;
BEGIN
  -- ===== 1. Apply App Settings =====
  FOR v_setting IN 
    SELECT setting_key, setting_value 
    FROM default_company_settings 
    WHERE setting_type = 'app_settings' AND setting_value IS NOT NULL AND setting_value != ''
  LOOP
    INSERT INTO app_settings (company_id, key, value)
    VALUES (NEW.id, v_setting.setting_key, v_setting.setting_value)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ===== 2. Apply Invoice Settings =====
  SELECT setting_value::jsonb INTO v_default_invoice_settings
  FROM default_company_settings
  WHERE setting_type = 'invoice_settings' AND setting_key = 'default_invoice_settings'
  LIMIT 1;

  IF v_default_invoice_settings IS NOT NULL THEN
    UPDATE companies
    SET invoice_settings = v_default_invoice_settings
    WHERE id = NEW.id;
  ELSE
    -- Use standard defaults if no custom defaults are set
    UPDATE companies
    SET invoice_settings = jsonb_build_object(
      'template', 'modern',
      'primary_color', '#10b981',
      'show_logo', true,
      'show_qr', true,
      'show_terms', true,
      'terms_text', 'الأسعار شاملة ضريبة القيمة المضافة 15%',
      'footer_text', 'شكراً لتعاملكم معنا'
    )
    WHERE id = NEW.id;
  END IF;

  -- ===== 3. Apply Tax Settings =====
  -- Get default tax settings or use defaults
  SELECT COALESCE(
    (SELECT setting_value FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'tax_name'),
    'ضريبة القيمة المضافة'
  ) INTO v_tax_name;
  
  SELECT COALESCE(
    (SELECT setting_value::numeric FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'tax_rate'),
    15
  ) INTO v_tax_rate;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'is_active'),
    true
  ) INTO v_tax_active;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'apply_to_sales'),
    true
  ) INTO v_apply_to_sales;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'apply_to_purchases'),
    true
  ) INTO v_apply_to_purchases;

  INSERT INTO tax_settings (
    company_id,
    tax_name,
    tax_rate,
    is_active,
    apply_to_sales,
    apply_to_purchases
  ) VALUES (
    NEW.id,
    v_tax_name,
    v_tax_rate,
    v_tax_active,
    v_apply_to_sales,
    v_apply_to_purchases
  ) ON CONFLICT DO NOTHING;

  -- ===== 4. Apply Accounting Settings =====
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_journal_entries_enabled'),
    true
  ) INTO v_auto_journal_enabled;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_sales_entries'),
    true
  ) INTO v_auto_sales_entries;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_purchase_entries'),
    true
  ) INTO v_auto_purchase_entries;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_expense_entries'),
    true
  ) INTO v_auto_expense_entries;

  INSERT INTO company_accounting_settings (
    company_id,
    auto_journal_entries_enabled,
    auto_sales_entries,
    auto_purchase_entries,
    auto_expense_entries
  ) VALUES (
    NEW.id,
    v_auto_journal_enabled,
    v_auto_sales_entries,
    v_auto_purchase_entries,
    v_auto_expense_entries
  ) ON CONFLICT DO NOTHING;

  -- ===== 5. Create Default Chart of Accounts =====
  -- الأصول
  INSERT INTO account_categories (company_id, code, name, type, is_system) VALUES
    (NEW.id, '1', 'الأصول', 'asset', true),
    (NEW.id, '1100', 'الأصول المتداولة', 'asset', true),
    (NEW.id, '1101', 'الصندوق الرئيسي', 'asset', true),
    (NEW.id, '1102', 'البنك', 'asset', true),
    (NEW.id, '1201', 'العملاء', 'asset', true),
    (NEW.id, '1301', 'المخزون', 'asset', true),
    (NEW.id, '1401', 'ضريبة القيمة المضافة - مدخلات', 'asset', true)
  ON CONFLICT DO NOTHING;

  -- الخصوم
  INSERT INTO account_categories (company_id, code, name, type, is_system) VALUES
    (NEW.id, '2', 'الخصوم', 'liability', true),
    (NEW.id, '2100', 'الخصوم المتداولة', 'liability', true),
    (NEW.id, '2101', 'الموردين', 'liability', true),
    (NEW.id, '2201', 'ضريبة القيمة المضافة - مخرجات', 'liability', true),
    (NEW.id, '2202', 'تسوية ضريبة القيمة المضافة', 'liability', true)
  ON CONFLICT DO NOTHING;

  -- حقوق الملكية
  INSERT INTO account_categories (company_id, code, name, type, is_system) VALUES
    (NEW.id, '3', 'حقوق الملكية', 'equity', true),
    (NEW.id, '3101', 'رأس المال', 'equity', true),
    (NEW.id, '3201', 'الأرباح المحتجزة', 'equity', true)
  ON CONFLICT DO NOTHING;

  -- الإيرادات
  INSERT INTO account_categories (company_id, code, name, type, is_system) VALUES
    (NEW.id, '4', 'الإيرادات', 'revenue', true),
    (NEW.id, '4101', 'المبيعات', 'revenue', true),
    (NEW.id, '4102', 'إيرادات بيع السيارات', 'revenue', true),
    (NEW.id, '4201', 'إيرادات أخرى', 'revenue', true)
  ON CONFLICT DO NOTHING;

  -- المصروفات
  INSERT INTO account_categories (company_id, code, name, type, is_system) VALUES
    (NEW.id, '5', 'المصروفات', 'expense', true),
    (NEW.id, '5101', 'تكلفة البضاعة المباعة', 'expense', true),
    (NEW.id, '5201', 'مصروفات الرواتب', 'expense', true),
    (NEW.id, '5202', 'مصروفات الإيجار', 'expense', true),
    (NEW.id, '5203', 'مصروفات عمومية وإدارية', 'expense', true),
    (NEW.id, '5204', 'مصروفات التسويق', 'expense', true),
    (NEW.id, '5205', 'مصروفات الصيانة', 'expense', true),
    (NEW.id, '5206', 'مصروفات متنوعة', 'expense', true)
  ON CONFLICT DO NOTHING;

  -- ===== 6. Create Default Expense Categories =====
  PERFORM create_default_expense_categories(NEW.id);

  RETURN NEW;
END;
$function$;
