-- Update default company settings based on أشبال النمار كار configuration
-- This will be used when creating new companies

-- First, clear existing default settings and add new ones
DELETE FROM default_company_settings;

-- App Settings Defaults
INSERT INTO default_company_settings (setting_key, setting_type, setting_value) VALUES
('app_name', 'app', 'حسبات اون لاين'),
('app_subtitle', 'app', 'لتجارة السيارات'),
('primary_color', 'app', '#3b82f6'),
('dashboard_title', 'app', 'لوحة التحكم'),
('purchases_title', 'app', 'المشتريات'),
('sales_title', 'app', 'المبيعات'),
('customers_title', 'app', 'العملاء'),
('suppliers_title', 'app', 'الموردين'),
('reports_title', 'app', 'التقارير'),
('welcome_message', 'app', 'مرحباً بك في نظام إدارة معارض السيارات'),
('signup_button_text', 'app', 'إنشاء حساب'),
('login_switch_text', 'app', ' إنشاء حساب جديد'),
('signup_switch_text', 'app', ' تسجيل الدخول');

-- Invoice Settings Defaults
INSERT INTO default_company_settings (setting_key, setting_type, setting_value) VALUES
('invoice_template', 'invoice', 'classic'),
('invoice_primary_color', 'invoice', '#1f2937'),
('invoice_show_logo', 'invoice', 'true'),
('invoice_show_qr', 'invoice', 'true'),
('invoice_show_terms', 'invoice', 'true'),
('invoice_logo_position', 'invoice', 'right'),
('invoice_qr_position', 'invoice', 'left'),
('invoice_seller_position', 'invoice', 'top'),
('invoice_buyer_position', 'invoice', 'bottom'),
('invoice_seller_title', 'invoice', 'معلومات الشركه'),
('invoice_buyer_title', 'invoice', 'العميل'),
('invoice_footer_text', 'invoice', 'هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية'),
('invoice_terms_text', 'invoice', 'شكراً لتعاملكم معنا');

-- Tax Settings Defaults
INSERT INTO default_company_settings (setting_key, setting_type, setting_value) VALUES
('vat_rate', 'tax', '15'),
('vat_enabled', 'tax', 'true');

-- Accounting Settings Defaults
INSERT INTO default_company_settings (setting_key, setting_type, setting_value) VALUES
('auto_journal_entries_enabled', 'accounting', 'true'),
('auto_sales_entries', 'accounting', 'true'),
('auto_purchase_entries', 'accounting', 'true'),
('auto_expense_entries', 'accounting', 'true');

-- Expense Categories Defaults (as JSON for the trigger to parse)
INSERT INTO default_company_settings (setting_key, setting_type, setting_value) VALUES
('default_expense_categories', 'expense', 'مصروفات ضيافه,إيجار,رواتب,كهرباء ومياه,صيانة,تسويق وإعلان,مصروفات إدارية');

-- Update the initialize_company_defaults function to use these settings
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
RETURNS TRIGGER AS $$
DECLARE
  setting_record RECORD;
  expense_categories TEXT[];
  expense_cat TEXT;
  default_invoice_settings JSONB;
BEGIN
  -- Create app_settings for the new company from defaults
  FOR setting_record IN 
    SELECT setting_key, setting_value FROM default_company_settings WHERE setting_type = 'app'
  LOOP
    INSERT INTO app_settings (company_id, key, value)
    VALUES (NEW.id, setting_record.setting_key, setting_record.setting_value)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Build invoice settings JSON from defaults
  default_invoice_settings := jsonb_build_object(
    'template', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_template'),
    'primary_color', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_primary_color'),
    'show_logo', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_show_logo')::boolean,
    'show_qr', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_show_qr')::boolean,
    'show_terms', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_show_terms')::boolean,
    'logo_position', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_logo_position'),
    'qr_position', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_qr_position'),
    'seller_position', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_seller_position'),
    'buyer_position', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_buyer_position'),
    'seller_title', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_seller_title'),
    'buyer_title', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_buyer_title'),
    'footer_text', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_footer_text'),
    'terms_text', (SELECT setting_value FROM default_company_settings WHERE setting_key = 'invoice_terms_text')
  );

  -- Update company with invoice settings
  UPDATE companies SET invoice_settings = default_invoice_settings WHERE id = NEW.id;

  -- Create default expense categories
  SELECT string_to_array(setting_value, ',') INTO expense_categories
  FROM default_company_settings WHERE setting_key = 'default_expense_categories';
  
  IF expense_categories IS NOT NULL THEN
    FOREACH expense_cat IN ARRAY expense_categories
    LOOP
      INSERT INTO expense_categories (company_id, name, is_active)
      VALUES (NEW.id, TRIM(expense_cat), true)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Create standard chart of accounts (same structure as النمار كار)
  -- Assets (1xxx)
  INSERT INTO account_categories (company_id, code, name, type, description, is_system) VALUES
  (NEW.id, '1', 'الأصول', 'assets', 'إجمالي أصول الشركة', true);
  
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '11', 'النقدية والبنوك', 'assets', 'حسابات النقدية والحسابات البنكية', true, 
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '1'));
  
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '1101', 'الصندوق الرئيسي', 'assets', 'النقدية في الصندوق', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '11')),
  (NEW.id, '1102', 'البنك - الحساب الجاري', 'assets', 'الحساب الجاري في البنك', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '11')),
  (NEW.id, '1103', 'نقاط البيع (مدى)', 'assets', 'مدفوعات نقاط البيع', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '11'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '12', 'الذمم المدينة', 'assets', 'المبالغ المستحقة من العملاء', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '1'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '1201', 'العملاء', 'assets', 'ذمم العملاء المدينة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '12')),
  (NEW.id, '1202', 'شيكات تحت التحصيل', 'assets', 'شيكات مؤجلة من العملاء', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '12')),
  (NEW.id, '1203', 'أقساط مستحقة', 'assets', 'أقساط مبيعات التقسيط', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '12'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '13', 'المخزون', 'assets', 'مخزون السيارات والبضائع', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '1'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '1301', 'مخزون السيارات', 'assets', 'السيارات المتاحة للبيع', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '13')),
  (NEW.id, '1302', 'سيارات بالأمانة', 'assets', 'سيارات محولة لمعارض أخرى', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '13'));

  -- Liabilities (2xxx)
  INSERT INTO account_categories (company_id, code, name, type, description, is_system) VALUES
  (NEW.id, '2', 'الخصوم', 'liabilities', 'إجمالي التزامات الشركة', true);
  
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '21', 'الذمم الدائنة', 'liabilities', 'المبالغ المستحقة للموردين', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '2'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '2101', 'الموردون', 'liabilities', 'ذمم الموردين الدائنة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '21')),
  (NEW.id, '2102', 'شيكات مؤجلة للموردين', 'liabilities', 'شيكات صادرة مؤجلة', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '21')),
  (NEW.id, '2103', 'أمانات سيارات (واردة)', 'liabilities', 'سيارات مستلمة بالأمانة', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '21'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '22', 'ضريبة القيمة المضافة', 'liabilities', 'حسابات ضريبة القيمة المضافة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '2'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '2201', 'ضريبة القيمة المضافة المستحقة', 'liabilities', 'ضريبة مستحقة على المبيعات', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '22')),
  (NEW.id, '2202', 'ضريبة القيمة المضافة المستردة', 'liabilities', 'ضريبة قابلة للاسترداد', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '22')),
  (NEW.id, '2203', 'تسوية ضريبة القيمة المضافة', 'liabilities', 'حساب تسوية الضريبة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '22'));

  -- Equity (3xxx)
  INSERT INTO account_categories (company_id, code, name, type, description, is_system) VALUES
  (NEW.id, '3', 'حقوق الملكية', 'equity', 'حقوق ملاك الشركة', true);
  
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '31', 'رأس المال', 'equity', 'رأس المال المستثمر', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '3')),
  (NEW.id, '32', 'الأرباح المحتجزة', 'equity', 'أرباح سنوات سابقة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '3'));

  -- Revenue (4xxx)
  INSERT INTO account_categories (company_id, code, name, type, description, is_system) VALUES
  (NEW.id, '4', 'الإيرادات', 'revenue', 'إجمالي إيرادات الشركة', true);
  
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '41', 'إيرادات المبيعات', 'revenue', 'إيرادات بيع السيارات', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '4'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '4101', 'مبيعات السيارات الجديدة', 'revenue', 'إيرادات بيع السيارات الجديدة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '41')),
  (NEW.id, '4102', 'عمولات الوساطة', 'revenue', 'عمولات من بيع سيارات بالوساطة', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '41'));

  -- Expenses (5xxx)
  INSERT INTO account_categories (company_id, code, name, type, description, is_system) VALUES
  (NEW.id, '5', 'المصروفات', 'expenses', 'إجمالي مصروفات الشركة', true);
  
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '51', 'تكلفة المبيعات', 'expenses', 'تكلفة السيارات المباعة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '5'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '5101', 'تكلفة السيارات المباعة', 'expenses', 'تكلفة شراء السيارات المباعة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '51'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '52', 'المصروفات التشغيلية', 'expenses', 'مصروفات تشغيل المعرض', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '5'));
    
  INSERT INTO account_categories (company_id, code, name, type, description, is_system, parent_id) VALUES
  (NEW.id, '5201', 'الإيجار', 'expenses', 'إيجار المعرض', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '52')),
  (NEW.id, '5202', 'الرواتب والأجور', 'expenses', 'رواتب الموظفين', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '52')),
  (NEW.id, '5203', 'الكهرباء والمياه', 'expenses', 'فواتير الخدمات', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '52')),
  (NEW.id, '5204', 'الصيانة والإصلاحات', 'expenses', 'صيانة المعرض والمعدات', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '52')),
  (NEW.id, '5205', 'التسويق والإعلان', 'expenses', 'مصروفات الدعاية', false,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '52')),
  (NEW.id, '5206', 'مصروفات إدارية عامة', 'expenses', 'مصروفات إدارية متنوعة', true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '52'));

  -- Create company_accounting_settings with proper account links
  INSERT INTO company_accounting_settings (
    company_id,
    auto_journal_entries_enabled,
    auto_sales_entries,
    auto_purchase_entries,
    auto_expense_entries,
    sales_cash_account_id,
    sales_revenue_account_id,
    purchase_cash_account_id,
    purchase_inventory_account_id,
    inventory_account_id,
    cogs_account_id,
    expense_account_id,
    expense_cash_account_id,
    suppliers_account_id,
    vat_payable_account_id,
    vat_recoverable_account_id,
    vat_settlement_account_id
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '1101'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '4101'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '1101'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '1301'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '1301'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '5101'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '5206'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '1101'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '2101'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '2201'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '2202'),
    (SELECT id FROM account_categories WHERE company_id = NEW.id AND code = '2203')
  ) ON CONFLICT (company_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION initialize_company_defaults();