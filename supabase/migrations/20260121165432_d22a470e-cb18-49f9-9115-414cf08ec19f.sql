
-- Update the initialize_company_defaults function to include invoice settings
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_default_invoice_settings jsonb;
BEGIN
  -- Get default invoice settings if they exist
  SELECT setting_value::jsonb INTO v_default_invoice_settings
  FROM default_company_settings
  WHERE setting_type = 'invoice_settings' AND setting_key = 'default_invoice_settings'
  LIMIT 1;

  -- Set default invoice settings on the new company
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

  -- Create default tax settings for the new company
  INSERT INTO tax_settings (
    company_id,
    tax_name,
    tax_rate,
    is_active,
    apply_to_sales,
    apply_to_purchases
  ) VALUES (
    NEW.id,
    'ضريبة القيمة المضافة',
    15,
    true,
    true,
    true
  ) ON CONFLICT DO NOTHING;

  -- Create default accounting settings for the new company
  INSERT INTO company_accounting_settings (
    company_id,
    auto_journal_entries_enabled,
    auto_sales_entries,
    auto_purchase_entries,
    auto_expense_entries
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true
  ) ON CONFLICT DO NOTHING;

  -- Create default chart of accounts for the new company
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

  RETURN NEW;
END;
$function$;
