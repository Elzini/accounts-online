-- تحديث trigger تهيئة الشركة ليستخدم قوالب دليل الحسابات بناءً على نوع الشركة
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  setting_record RECORD;
  expense_cat_record RECORD;
  cash_account_id UUID;
  revenue_account_id UUID;
  inventory_account_id UUID;
  cogs_account_id UUID;
  suppliers_account_id UUID;
  expense_account_id UUID;
  vat_payable_id UUID;
  vat_recoverable_id UUID;
  vat_settlement_id UUID;
  prepaid_expenses_account_id UUID;
  current_year INTEGER;
  fiscal_year_id UUID;
  company_type_val TEXT;
BEGIN
  -- Get current year for fiscal year creation
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  company_type_val := NEW.company_type::TEXT;
  
  -- ============================================
  -- 1. CREATE CHART OF ACCOUNTS FROM TEMPLATES
  -- ============================================
  
  -- Insert accounts from coa_templates based on company type
  FOR account_record IN 
    SELECT * FROM public.coa_templates 
    WHERE company_type = NEW.company_type
    ORDER BY sort_order
  LOOP
    INSERT INTO public.account_categories (
      company_id, 
      code, 
      name, 
      type, 
      description, 
      is_system
    )
    VALUES (
      NEW.id,
      account_record.code,
      account_record.name,
      account_record.type,
      COALESCE(account_record.name_en, account_record.name),
      true
    );
  END LOOP;
  
  -- Get specific account IDs (common accounts across all company types)
  SELECT id INTO cash_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1101';
  SELECT id INTO suppliers_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2101';
  SELECT id INTO vat_payable_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2102';
  
  -- Get revenue account based on company type
  IF NEW.company_type = 'car_dealership' THEN
    SELECT id INTO inventory_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1301';
    SELECT id INTO revenue_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '4101';
    SELECT id INTO cogs_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5101';
    SELECT id INTO expense_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5201';
  ELSIF NEW.company_type = 'construction' THEN
    SELECT id INTO inventory_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1301';
    SELECT id INTO revenue_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '4101';
    SELECT id INTO cogs_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5101';
    SELECT id INTO expense_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5201';
  ELSIF NEW.company_type = 'general_trading' THEN
    SELECT id INTO inventory_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1301';
    SELECT id INTO revenue_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '4101';
    SELECT id INTO cogs_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5101';
    SELECT id INTO expense_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5201';
  END IF;
  
  -- ============================================
  -- 2. CREATE COMPANY ACCOUNTING SETTINGS
  -- ============================================
  INSERT INTO public.company_accounting_settings (
    company_id,
    auto_journal_entries_enabled,
    auto_sales_entries,
    auto_purchase_entries,
    auto_expense_entries,
    sales_revenue_account_id,
    sales_cash_account_id,
    purchase_inventory_account_id,
    purchase_cash_account_id,
    cogs_account_id,
    inventory_account_id,
    suppliers_account_id,
    expense_account_id,
    expense_cash_account_id,
    vat_payable_account_id
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    revenue_account_id,
    cash_account_id,
    inventory_account_id,
    cash_account_id,
    cogs_account_id,
    inventory_account_id,
    suppliers_account_id,
    expense_account_id,
    cash_account_id,
    vat_payable_id
  );

  -- ============================================
  -- 3. CREATE DEFAULT EXPENSE CATEGORIES
  -- ============================================
  
  IF NEW.company_type = 'car_dealership' THEN
    INSERT INTO public.expense_categories (company_id, name, description, is_active)
    VALUES 
      (NEW.id, 'صيانة السيارات', 'مصروفات صيانة وإصلاح السيارات', true),
      (NEW.id, 'وقود ومواصلات', 'مصروفات الوقود والتنقل', true),
      (NEW.id, 'تأمين', 'مصروفات التأمين', true),
      (NEW.id, 'إيجار', 'إيجار المعرض والمكاتب', true),
      (NEW.id, 'رواتب وأجور', 'رواتب الموظفين والعمال', true),
      (NEW.id, 'مصروفات إدارية', 'مصروفات إدارية عامة', true),
      (NEW.id, 'تسويق وإعلان', 'مصروفات الدعاية والإعلان', true),
      (NEW.id, 'مرافق', 'الكهرباء والماء والاتصالات', true);
  ELSIF NEW.company_type = 'construction' THEN
    INSERT INTO public.expense_categories (company_id, name, description, is_active)
    VALUES 
      (NEW.id, 'مواد بناء', 'مصروفات مواد البناء والتشييد', true),
      (NEW.id, 'عمالة', 'أجور العمالة في المشاريع', true),
      (NEW.id, 'معدات وآلات', 'إيجار وصيانة المعدات', true),
      (NEW.id, 'مقاولين من الباطن', 'مستحقات المقاولين', true),
      (NEW.id, 'نقل ومواصلات', 'مصروفات النقل والشحن', true),
      (NEW.id, 'تأمين المشاريع', 'تأمين المشاريع والعمال', true),
      (NEW.id, 'رواتب وأجور', 'رواتب الموظفين الإداريين', true),
      (NEW.id, 'مصروفات إدارية', 'مصروفات إدارية عامة', true);
  ELSIF NEW.company_type = 'general_trading' THEN
    INSERT INTO public.expense_categories (company_id, name, description, is_active)
    VALUES 
      (NEW.id, 'شحن وتوصيل', 'مصروفات الشحن والتوصيل', true),
      (NEW.id, 'تخزين', 'مصروفات المستودعات', true),
      (NEW.id, 'تسويق وإعلان', 'مصروفات الدعاية والإعلان', true),
      (NEW.id, 'إيجار', 'إيجار المحل والمستودعات', true),
      (NEW.id, 'رواتب وأجور', 'رواتب الموظفين', true),
      (NEW.id, 'مصروفات إدارية', 'مصروفات إدارية عامة', true),
      (NEW.id, 'مرافق', 'الكهرباء والماء والاتصالات', true),
      (NEW.id, 'تأمين', 'تأمين البضائع والمحل', true);
  END IF;

  -- ============================================
  -- 4. CREATE DEFAULT APP SETTINGS
  -- ============================================
  INSERT INTO public.app_settings (company_id, key, value)
  VALUES 
    (NEW.id, 'app_name', NEW.name),
    (NEW.id, 'app_subtitle', CASE 
      WHEN NEW.company_type = 'car_dealership' THEN 'نظام إدارة معارض السيارات'
      WHEN NEW.company_type = 'construction' THEN 'نظام إدارة المقاولات'
      WHEN NEW.company_type = 'general_trading' THEN 'نظام إدارة التجارة'
      ELSE 'نظام إدارة الأعمال'
    END),
    (NEW.id, 'welcome_message', 'مرحباً بك في ' || NEW.name),
    (NEW.id, 'vat_rate', '15'),
    (NEW.id, 'vat_number', ''),
    (NEW.id, 'currency', 'ريال سعودي'),
    (NEW.id, 'currency_symbol', 'ر.س');

  -- ============================================
  -- 5. CREATE MENU LABELS BASED ON COMPANY TYPE
  -- ============================================
  IF NEW.company_type = 'car_dealership' THEN
    INSERT INTO public.app_settings (company_id, key, value)
    VALUES 
      (NEW.id, 'menu_label_dashboard', 'لوحة التحكم'),
      (NEW.id, 'menu_label_customers', 'العملاء'),
      (NEW.id, 'menu_label_suppliers', 'الموردون'),
      (NEW.id, 'menu_label_purchases', 'المشتريات'),
      (NEW.id, 'menu_label_sales', 'المبيعات'),
      (NEW.id, 'menu_label_inventory', 'المخزون'),
      (NEW.id, 'menu_label_reports', 'التقارير'),
      (NEW.id, 'menu_label_accounting', 'المحاسبة'),
      (NEW.id, 'menu_label_settings', 'الإعدادات');
  ELSIF NEW.company_type = 'construction' THEN
    INSERT INTO public.app_settings (company_id, key, value)
    VALUES 
      (NEW.id, 'menu_label_dashboard', 'لوحة التحكم'),
      (NEW.id, 'menu_label_customers', 'العملاء'),
      (NEW.id, 'menu_label_suppliers', 'الموردون'),
      (NEW.id, 'menu_label_purchases', 'المشتريات'),
      (NEW.id, 'menu_label_sales', 'المشاريع'),
      (NEW.id, 'menu_label_inventory', 'المواد والمعدات'),
      (NEW.id, 'menu_label_reports', 'التقارير'),
      (NEW.id, 'menu_label_accounting', 'المحاسبة'),
      (NEW.id, 'menu_label_settings', 'الإعدادات');
  ELSIF NEW.company_type = 'general_trading' THEN
    INSERT INTO public.app_settings (company_id, key, value)
    VALUES 
      (NEW.id, 'menu_label_dashboard', 'لوحة التحكم'),
      (NEW.id, 'menu_label_customers', 'العملاء'),
      (NEW.id, 'menu_label_suppliers', 'الموردون'),
      (NEW.id, 'menu_label_purchases', 'المشتريات'),
      (NEW.id, 'menu_label_sales', 'المبيعات'),
      (NEW.id, 'menu_label_inventory', 'المخزون'),
      (NEW.id, 'menu_label_reports', 'التقارير'),
      (NEW.id, 'menu_label_accounting', 'المحاسبة'),
      (NEW.id, 'menu_label_settings', 'الإعدادات');
  END IF;

  -- ============================================
  -- 6. CREATE DEFAULT FISCAL YEAR
  -- ============================================
  INSERT INTO public.fiscal_years (
    company_id,
    name,
    start_date,
    end_date,
    is_current,
    status
  ) VALUES (
    NEW.id,
    current_year::TEXT,
    make_date(current_year, 1, 1),
    make_date(current_year, 12, 31),
    true,
    'active'
  )
  RETURNING id INTO fiscal_year_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;