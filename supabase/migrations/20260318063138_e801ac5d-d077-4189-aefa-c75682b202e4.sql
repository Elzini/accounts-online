
-- Update create_default_accounts: move أرباح مستحقة to assets (code 1206 under الذمم المدينة)
CREATE OR REPLACE FUNCTION public.create_default_accounts(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_type text;
  v_assets_id uuid;
  v_liabilities_id uuid;
  v_equity_id uuid;
  v_revenue_id uuid;
  v_expenses_id uuid;
  v_cash_id uuid;
  v_receivables_id uuid;
  v_inventory_id uuid;
  v_fixed_assets_id uuid;
  v_payables_id uuid;
  v_vat_id uuid;
  v_other_liab_id uuid;
  v_capital_id uuid;
  v_sales_rev_id uuid;
  v_other_rev_id uuid;
  v_cogs_id uuid;
  v_admin_exp_id uuid;
  v_sales_exp_id uuid;
  v_other_exp_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM account_categories WHERE company_id = p_company_id LIMIT 1) THEN
    RETURN;
  END IF;

  SELECT company_type::text INTO v_company_type FROM companies WHERE id = p_company_id;

  IF v_company_type = 'real_estate' THEN
    PERFORM create_real_estate_accounts(p_company_id);
    RETURN;
  END IF;

  -- ==================== الأصول ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '1', 'الأصول', 'assets', true, 'إجمالي أصول الشركة')
  RETURNING id INTO v_assets_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '11', 'النقدية والبنوك', 'assets', true, v_assets_id, 'حسابات النقدية والحسابات البنكية')
  RETURNING id INTO v_cash_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1101', 'الصندوق الرئيسي', 'assets', true, v_cash_id, 'النقدية في الصندوق'),
  (p_company_id, '1102', 'البنك - الحساب الجاري', 'assets', false, v_cash_id, 'الحساب الجاري في البنك'),
  (p_company_id, '1103', 'نقاط البيع (مدى)', 'assets', false, v_cash_id, 'مدفوعات نقاط البيع');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '12', 'الذمم المدينة', 'assets', true, v_assets_id, 'المبالغ المستحقة من العملاء')
  RETURNING id INTO v_receivables_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1201', 'العملاء', 'assets', true, v_receivables_id, 'ذمم العملاء المدينة'),
  (p_company_id, '1202', 'شيكات تحت التحصيل', 'assets', false, v_receivables_id, 'شيكات مؤجلة من العملاء'),
  (p_company_id, '1203', 'أقساط مستحقة', 'assets', false, v_receivables_id, 'أقساط مبيعات التقسيط'),
  (p_company_id, '1204', 'سلف الموظفين', 'assets', false, v_receivables_id, 'سلف مقدمة للموظفين'),
  (p_company_id, '1206', 'أرباح مستحقة', 'assets', false, v_receivables_id, 'أرباح مستحقة التحصيل');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '13', 'المخزون', 'assets', true, v_assets_id, 'مخزون السيارات والبضائع')
  RETURNING id INTO v_inventory_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1301', 'مخزون السيارات', 'assets', true, v_inventory_id, 'السيارات المتاحة للبيع'),
  (p_company_id, '1302', 'سيارات بالأمانة', 'assets', false, v_inventory_id, 'سيارات محولة لمعارض أخرى'),
  (p_company_id, '1303', 'قطع الغيار والإكسسوارات', 'assets', false, v_inventory_id, 'قطع غيار وإكسسوارات');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '14', 'الأصول الثابتة', 'assets', false, v_assets_id, 'الممتلكات والمعدات')
  RETURNING id INTO v_fixed_assets_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1401', 'المباني والمعارض', 'assets', false, v_fixed_assets_id, 'مباني ومعارض مملوكة'),
  (p_company_id, '1402', 'الأثاث والتجهيزات', 'assets', false, v_fixed_assets_id, 'أثاث وتجهيزات المعرض'),
  (p_company_id, '1403', 'المركبات', 'assets', false, v_fixed_assets_id, 'مركبات الشركة'),
  (p_company_id, '1404', 'أجهزة الحاسب والمعدات', 'assets', false, v_fixed_assets_id, 'أجهزة حاسب ومعدات'),
  (p_company_id, '1490', 'مجمع الإهلاك', 'assets', false, v_fixed_assets_id, 'مجمع إهلاك الأصول الثابتة');

  -- ==================== الخصوم ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '2', 'الخصوم', 'liabilities', true, null, 'إجمالي التزامات الشركة')
  RETURNING id INTO v_liabilities_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '21', 'الذمم الدائنة', 'liabilities', true, v_liabilities_id, 'المبالغ المستحقة للموردين')
  RETURNING id INTO v_payables_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2101', 'الموردون', 'liabilities', true, v_payables_id, 'ذمم الموردين الدائنة'),
  (p_company_id, '2102', 'شيكات مؤجلة للموردين', 'liabilities', false, v_payables_id, 'شيكات صادرة مؤجلة'),
  (p_company_id, '2103', 'أمانات سيارات (واردة)', 'liabilities', false, v_payables_id, 'سيارات مستلمة بالأمانة من معارض أخرى');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '22', 'ضريبة القيمة المضافة', 'liabilities', true, v_liabilities_id, 'حسابات ضريبة القيمة المضافة')
  RETURNING id INTO v_vat_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2201', 'ضريبة القيمة المضافة المستحقة', 'liabilities', true, v_vat_id, 'ضريبة مستحقة على المبيعات'),
  (p_company_id, '2202', 'ضريبة القيمة المضافة المستردة', 'liabilities', true, v_vat_id, 'ضريبة قابلة للاسترداد على المشتريات'),
  (p_company_id, '2203', 'حساب تسوية ضريبة القيمة المضافة', 'liabilities', true, v_vat_id, 'حساب تسوية الضريبة مع هيئة الزكاة والضريبة والجمارك');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '23', 'مستحقات أخرى', 'liabilities', false, v_liabilities_id, 'التزامات أخرى')
  RETURNING id INTO v_other_liab_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2301', 'مستحقات الموظفين', 'liabilities', false, v_other_liab_id, 'رواتب ومستحقات موظفين'),
  (p_company_id, '2302', 'التأمينات الاجتماعية', 'liabilities', false, v_other_liab_id, 'اشتراكات التأمينات'),
  (p_company_id, '2303', 'عربون مقدم من العملاء', 'liabilities', false, v_other_liab_id, 'عربون مستلم لحجز سيارة');

  -- ==================== حقوق الملكية ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '3', 'حقوق الملكية', 'equity', true, null, 'حقوق ملاك الشركة')
  RETURNING id INTO v_equity_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '31', 'رأس المال', 'equity', true, v_equity_id, 'رأس مال الشركة')
  RETURNING id INTO v_capital_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '3101', 'رأس المال المدفوع', 'equity', true, v_capital_id, 'رأس المال المسجل'),
  (p_company_id, '3102', 'جاري الشريك', 'equity', false, v_capital_id, 'حساب جاري المالك'),
  (p_company_id, '32', 'الأرباح المحتجزة', 'equity', true, v_equity_id, 'أرباح محتجزة من سنوات سابقة'),
  (p_company_id, '33', 'أرباح / خسائر العام', 'equity', true, v_equity_id, 'نتيجة العام الحالي');

  -- ==================== الإيرادات ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '4', 'الإيرادات', 'revenue', true, null, 'إجمالي إيرادات الشركة')
  RETURNING id INTO v_revenue_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '41', 'إيرادات المبيعات', 'revenue', true, v_revenue_id, 'إيرادات بيع السيارات')
  RETURNING id INTO v_sales_rev_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '4101', 'مبيعات السيارات الجديدة', 'revenue', true, v_sales_rev_id, 'مبيعات سيارات جديدة'),
  (p_company_id, '4102', 'مبيعات السيارات المستعملة', 'revenue', true, v_sales_rev_id, 'مبيعات سيارات مستعملة'),
  (p_company_id, '4103', 'مبيعات قطع الغيار', 'revenue', false, v_sales_rev_id, 'مبيعات قطع غيار وإكسسوارات');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '42', 'إيرادات أخرى', 'revenue', false, v_revenue_id, 'إيرادات غير المبيعات')
  RETURNING id INTO v_other_rev_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '4201', 'إيرادات العمولات', 'revenue', true, v_other_rev_id, 'عمولات وساطة بيع'),
  (p_company_id, '4202', 'إيرادات نقل الملكية', 'revenue', false, v_other_rev_id, 'رسوم نقل ملكية'),
  (p_company_id, '4203', 'إيرادات التأمين', 'revenue', false, v_other_rev_id, 'عمولات وساطة تأمين'),
  (p_company_id, '4204', 'إيرادات متنوعة', 'revenue', false, v_other_rev_id, 'إيرادات أخرى متنوعة');

  -- ==================== المصروفات ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '5', 'المصروفات', 'expenses', true, null, 'إجمالي مصروفات الشركة')
  RETURNING id INTO v_expenses_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '51', 'تكلفة البضاعة المباعة', 'expenses', true, v_expenses_id, 'تكلفة السيارات المباعة')
  RETURNING id INTO v_cogs_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5101', 'تكلفة شراء السيارات', 'expenses', true, v_cogs_id, 'تكلفة شراء السيارات المباعة'),
  (p_company_id, '5102', 'مصاريف تجهيز السيارات', 'expenses', false, v_cogs_id, 'تكاليف صيانة وتجهيز');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '52', 'المصروفات الإدارية', 'expenses', false, v_expenses_id, 'مصاريف إدارية وعمومية')
  RETURNING id INTO v_admin_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5201', 'الرواتب والأجور', 'expenses', false, v_admin_exp_id, 'رواتب وأجور الموظفين'),
  (p_company_id, '5202', 'الإيجارات', 'expenses', false, v_admin_exp_id, 'إيجار المعرض والمكاتب'),
  (p_company_id, '5203', 'الكهرباء والماء', 'expenses', false, v_admin_exp_id, 'فواتير خدمات'),
  (p_company_id, '5204', 'الاتصالات والإنترنت', 'expenses', false, v_admin_exp_id, 'فواتير اتصالات'),
  (p_company_id, '5205', 'مصاريف حكومية ورسوم', 'expenses', false, v_admin_exp_id, 'رسوم حكومية وتراخيص'),
  (p_company_id, '5206', 'مصاريف بنكية', 'expenses', false, v_admin_exp_id, 'عمولات ورسوم بنكية'),
  (p_company_id, '5207', 'مصاريف التأمين', 'expenses', false, v_admin_exp_id, 'أقساط تأمين'),
  (p_company_id, '5208', 'الصيانة والنظافة', 'expenses', false, v_admin_exp_id, 'مصاريف صيانة ونظافة'),
  (p_company_id, '5209', 'مصاريف إدارية أخرى', 'expenses', false, v_admin_exp_id, 'مصاريف إدارية متنوعة');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '53', 'مصاريف البيع والتسويق', 'expenses', false, v_expenses_id, 'مصاريف متعلقة بالمبيعات')
  RETURNING id INTO v_sales_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5301', 'عمولات المبيعات', 'expenses', false, v_sales_exp_id, 'عمولات بيع للموظفين'),
  (p_company_id, '5302', 'الإعلان والتسويق', 'expenses', false, v_sales_exp_id, 'مصاريف دعاية وإعلان'),
  (p_company_id, '5303', 'مصاريف نقل السيارات', 'expenses', false, v_sales_exp_id, 'شحن ونقل السيارات');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '54', 'مصاريف أخرى', 'expenses', false, v_expenses_id, 'مصاريف غير مصنفة')
  RETURNING id INTO v_other_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5401', 'مصاريف متنوعة', 'expenses', false, v_other_exp_id, 'مصاريف أخرى'),
  (p_company_id, '5402', 'إهلاك الأصول الثابتة', 'expenses', false, v_other_exp_id, 'مصروف إهلاك سنوي'),
  (p_company_id, '5403', 'خسائر بيع أصول', 'expenses', false, v_other_exp_id, 'خسائر ناتجة عن بيع أصول');

END;
$function$;
