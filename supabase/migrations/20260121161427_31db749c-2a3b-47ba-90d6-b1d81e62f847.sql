-- Create a function to initialize default settings for new companies
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Create trigger to run on new company creation
DROP TRIGGER IF EXISTS initialize_company_defaults_trigger ON companies;
CREATE TRIGGER initialize_company_defaults_trigger
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION initialize_company_defaults();

-- Add comment explaining this trigger
COMMENT ON FUNCTION initialize_company_defaults() IS 'تهيئة الإعدادات الافتراضية عند إنشاء شركة جديدة: إعدادات الضريبة، إعدادات المحاسبة، ودليل الحسابات الأساسي';