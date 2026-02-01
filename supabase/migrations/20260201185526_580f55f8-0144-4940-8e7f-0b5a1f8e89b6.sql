
-- Update initialize_company_defaults to include ALL menu settings
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
BEGIN
  -- Get current year for fiscal year creation
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- ============================================
  -- 1. CREATE STANDARD CHART OF ACCOUNTS
  -- ============================================
  
  -- Assets (1xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '1000', 'الأصول', 'assets', 'الأصول الرئيسية', true),
    (NEW.id, '1100', 'النقدية والبنوك', 'assets', 'الحسابات النقدية والبنكية', true),
    (NEW.id, '1101', 'الصندوق الرئيسي', 'assets', 'النقدية في الصندوق', true),
    (NEW.id, '1102', 'البنك', 'assets', 'الحساب البنكي', true),
    (NEW.id, '1200', 'الذمم المدينة', 'assets', 'المبالغ المستحقة من العملاء', true),
    (NEW.id, '1201', 'ذمم العملاء', 'assets', 'حسابات العملاء المدينة', true),
    (NEW.id, '1204', 'سلف الموظفين', 'assets', 'سلف مقدمة للموظفين', true),
    (NEW.id, '1300', 'الأصول المتداولة', 'assets', 'الأصول المتداولة الأخرى', true),
    (NEW.id, '1301', 'مخزون السيارات', 'assets', 'قيمة السيارات في المخزون', true),
    (NEW.id, '1302', 'المصروفات المقدمة', 'assets', 'مصروفات مدفوعة مقدماً', true),
    (NEW.id, '1304', 'المصروفات المقدمة العامة', 'assets', 'مصروفات مقدمة عامة', true),
    (NEW.id, '1305', 'إيجار مقدم', 'assets', 'إيجار مدفوع مقدماً', true);
  
  -- Get specific account IDs
  SELECT id INTO cash_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1101';
  SELECT id INTO inventory_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1301';
  SELECT id INTO prepaid_expenses_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1302';
  
  -- Liabilities (2xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '2000', 'الخصوم', 'liabilities', 'الخصوم الرئيسية', true),
    (NEW.id, '2100', 'الذمم الدائنة', 'liabilities', 'المبالغ المستحقة للموردين', true),
    (NEW.id, '2101', 'ذمم الموردين', 'liabilities', 'حسابات الموردين الدائنة', true),
    (NEW.id, '2200', 'ضريبة القيمة المضافة', 'liabilities', 'حسابات الضريبة', true),
    (NEW.id, '2201', 'ضريبة المخرجات', 'liabilities', 'ضريبة القيمة المضافة على المبيعات', true),
    (NEW.id, '2202', 'ضريبة المدخلات', 'liabilities', 'ضريبة القيمة المضافة على المشتريات', true),
    (NEW.id, '2203', 'تسوية ضريبة القيمة المضافة', 'liabilities', 'حساب تسوية الضريبة', true);
  
  SELECT id INTO suppliers_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2101';
  SELECT id INTO vat_payable_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2201';
  SELECT id INTO vat_recoverable_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2202';
  SELECT id INTO vat_settlement_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2203';
  
  -- Equity (3xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '3000', 'حقوق الملكية', 'equity', 'حقوق الملكية', true),
    (NEW.id, '3100', 'رأس المال', 'equity', 'رأس مال الشركة', true),
    (NEW.id, '3200', 'الأرباح المحتجزة', 'equity', 'الأرباح المتراكمة', true);
  
  -- Revenue (4xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '4000', 'الإيرادات', 'revenue', 'إيرادات الشركة', true),
    (NEW.id, '4100', 'إيرادات المبيعات', 'revenue', 'إيرادات بيع السيارات', true),
    (NEW.id, '4101', 'مبيعات السيارات الجديدة', 'revenue', 'إيرادات مبيعات السيارات الجديدة', true);
  
  SELECT id INTO revenue_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '4101';
  
  -- Expenses (5xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '5000', 'المصروفات', 'expenses', 'مصروفات الشركة', true),
    (NEW.id, '5100', 'تكلفة البضاعة المباعة', 'expenses', 'تكلفة السيارات المباعة', true),
    (NEW.id, '5101', 'تكلفة المبيعات', 'expenses', 'تكلفة شراء السيارات المباعة', true),
    (NEW.id, '5200', 'المصروفات التشغيلية', 'expenses', 'المصروفات التشغيلية العامة', true),
    (NEW.id, '5201', 'الرواتب والأجور', 'expenses', 'مصروفات الرواتب والأجور', true),
    (NEW.id, '5202', 'الإيجارات', 'expenses', 'مصروفات الإيجار', true),
    (NEW.id, '5203', 'الصيانة', 'expenses', 'مصروفات الصيانة', true),
    (NEW.id, '5204', 'المرافق', 'expenses', 'مصروفات الكهرباء والماء', true),
    (NEW.id, '5205', 'مصروفات أخرى', 'expenses', 'مصروفات متنوعة أخرى', true),
    (NEW.id, '5407', 'مصروفات الإيجار المقدم', 'expenses', 'مصروفات الإيجار المقدم المستهلكة', true);
  
  SELECT id INTO cogs_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5101';
  SELECT id INTO expense_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5200';
  
  -- ============================================
  -- 2. CREATE COMPANY ACCOUNTING SETTINGS
  -- ============================================
  INSERT INTO public.company_accounting_settings (
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
    suppliers_account_id,
    expense_account_id,
    expense_cash_account_id,
    vat_payable_account_id,
    vat_recoverable_account_id,
    vat_settlement_account_id
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    cash_account_id,
    revenue_account_id,
    cash_account_id,
    inventory_account_id,
    inventory_account_id,
    cogs_account_id,
    suppliers_account_id,
    expense_account_id,
    cash_account_id,
    vat_payable_id,
    vat_recoverable_id,
    vat_settlement_id
  );
  
  -- ============================================
  -- 3. CREATE DEFAULT EXPENSE CATEGORIES
  -- ============================================
  INSERT INTO public.expense_categories (company_id, name, description, is_active)
  VALUES 
    (NEW.id, 'الإيجارات', 'مصروفات إيجار المعرض والمكاتب', true),
    (NEW.id, 'الرواتب والأجور', 'رواتب الموظفين والعمال', true),
    (NEW.id, 'الصيانة والإصلاحات', 'مصروفات صيانة السيارات والمعدات', true),
    (NEW.id, 'المرافق', 'الكهرباء والماء والهاتف', true),
    (NEW.id, 'التسويق والإعلان', 'مصروفات الدعاية والإعلان', true),
    (NEW.id, 'النقل والمواصلات', 'مصروفات نقل السيارات', true),
    (NEW.id, 'اللوازم المكتبية', 'مستلزمات المكتب', true),
    (NEW.id, 'التأمين', 'مصروفات التأمين', true),
    (NEW.id, 'الرسوم الحكومية', 'رسوم الترخيص والتسجيل', true),
    (NEW.id, 'مصروفات أخرى', 'مصروفات متنوعة', true);
  
  -- ============================================
  -- 4. APPLY ALL APP SETTINGS FROM DEFAULTS
  -- ============================================
  FOR setting_record IN 
    SELECT setting_key, setting_value 
    FROM public.default_company_settings 
    WHERE setting_type = 'app_settings'
  LOOP
    INSERT INTO public.app_settings (company_id, key, value)
    VALUES (NEW.id, setting_record.setting_key, setting_record.setting_value)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- ============================================
  -- 5. APPLY TAX SETTINGS
  -- ============================================
  FOR setting_record IN 
    SELECT setting_key, setting_value 
    FROM public.default_company_settings 
    WHERE setting_type = 'tax'
  LOOP
    INSERT INTO public.app_settings (company_id, key, value)
    VALUES (NEW.id, setting_record.setting_key, setting_record.setting_value)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- ============================================
  -- 6. APPLY INVOICE SETTINGS
  -- ============================================
  FOR setting_record IN 
    SELECT setting_key, setting_value 
    FROM public.default_company_settings 
    WHERE setting_type = 'invoice'
  LOOP
    INSERT INTO public.app_settings (company_id, key, value)
    VALUES (NEW.id, setting_record.setting_key, setting_record.setting_value)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Also update companies table invoice_settings if exists
  SELECT setting_value INTO setting_record 
  FROM public.default_company_settings 
  WHERE setting_key = 'invoice_settings' AND setting_type = 'invoice';
  
  IF setting_record IS NOT NULL THEN
    UPDATE public.companies 
    SET invoice_settings = setting_record.setting_value::jsonb 
    WHERE id = NEW.id;
  END IF;
  
  -- ============================================
  -- 7. APPLY THEME SETTINGS
  -- ============================================
  INSERT INTO public.app_settings (company_id, key, value)
  VALUES 
    (NEW.id, 'primary_color', '#3b82f6'),
    (NEW.id, 'sidebar_bg_color', '#1f2937'),
    (NEW.id, 'font_family', 'Cairo'),
    (NEW.id, 'font_size', '16')
  ON CONFLICT DO NOTHING;
  
  -- ============================================
  -- 8. CREATE DEFAULT DASHBOARD CONFIG
  -- ============================================
  INSERT INTO public.dashboard_config (
    company_id,
    stat_cards,
    analytics_settings,
    layout_settings
  )
  VALUES (
    NEW.id,
    '[
      {"id": "monthly_sales", "label": "مبيعات الشهر", "size": "medium", "enabled": true},
      {"id": "monthly_purchases", "label": "مشتريات الشهر", "size": "medium", "enabled": true},
      {"id": "available_cars", "label": "السيارات المتوفرة", "size": "medium", "enabled": true},
      {"id": "total_customers", "label": "إجمالي العملاء", "size": "medium", "enabled": true},
      {"id": "monthly_profit", "label": "أرباح الشهر", "size": "medium", "enabled": true},
      {"id": "overdue_installments", "label": "الأقساط المتأخرة", "size": "medium", "enabled": true}
    ]'::jsonb,
    '{
      "sales_chart": {"enabled": true, "width": "half"},
      "inventory_chart": {"enabled": true, "width": "half"},
      "performance_metrics": {"enabled": true, "width": "full"},
      "recent_activity": {"enabled": true, "width": "half"},
      "top_performers": {"enabled": true, "width": "half"}
    }'::jsonb,
    '{
      "cards_per_row": 4,
      "grid_gap": 4
    }'::jsonb
  );
  
  -- ============================================
  -- 9. CREATE DEFAULT FISCAL YEAR
  -- ============================================
  INSERT INTO public.fiscal_years (
    company_id,
    name,
    start_date,
    end_date,
    is_current,
    status
  )
  VALUES (
    NEW.id,
    'السنة المالية ' || current_year,
    (current_year || '-01-01')::date,
    (current_year || '-12-31')::date,
    true,
    'open'
  )
  RETURNING id INTO fiscal_year_id;
  
  -- ============================================
  -- 10. CREATE DEFAULT TAX SETTINGS
  -- ============================================
  INSERT INTO public.tax_settings (
    company_id,
    vat_enabled,
    vat_rate,
    vat_number
  )
  VALUES (
    NEW.id,
    true,
    15.00,
    ''
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$function$;
