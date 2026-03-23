-- Update create_default_accounts to use singular types and auto-populate mappings
CREATE OR REPLACE FUNCTION create_default_accounts(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_type text;
  v_assets_id uuid;
  v_liabilities_id uuid;
  v_equity_id uuid;
  v_revenue_id uuid;
  v_cogs_root_id uuid;
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
    PERFORM populate_account_mappings(p_company_id);
    RETURN;
  END IF;

  -- 1 الأصول
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '1', 'الأصول', 'asset', true, 'إجمالي أصول الشركة')
  RETURNING id INTO v_assets_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '11', 'النقدية والبنوك', 'asset', true, v_assets_id, 'حسابات النقدية والحسابات البنكية')
  RETURNING id INTO v_cash_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1101', 'الصندوق الرئيسي', 'asset', true, v_cash_id, 'النقدية في الصندوق'),
  (p_company_id, '1102', 'البنك - الحساب الجاري', 'asset', false, v_cash_id, 'الحساب الجاري في البنك'),
  (p_company_id, '1103', 'نقاط البيع (مدى)', 'asset', false, v_cash_id, 'مدفوعات نقاط البيع');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '12', 'الذمم المدينة', 'asset', true, v_assets_id, 'المبالغ المستحقة من العملاء')
  RETURNING id INTO v_receivables_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1201', 'العملاء', 'asset', true, v_receivables_id, 'ذمم العملاء المدينة'),
  (p_company_id, '1202', 'شيكات تحت التحصيل', 'asset', false, v_receivables_id, 'شيكات مؤجلة من العملاء'),
  (p_company_id, '1203', 'أقساط مستحقة', 'asset', false, v_receivables_id, 'أقساط مبيعات التقسيط'),
  (p_company_id, '1204', 'سلف الموظفين', 'asset', false, v_receivables_id, 'سلف مقدمة للموظفين'),
  (p_company_id, '1205', 'أرباح مستحقة', 'asset', false, v_receivables_id, 'أرباح مستحقة التحصيل');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '13', 'المخزون', 'asset', true, v_assets_id, 'مخزون السيارات والبضائع')
  RETURNING id INTO v_inventory_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1301', 'مخزون السيارات', 'asset', true, v_inventory_id, 'السيارات المتاحة للبيع'),
  (p_company_id, '1302', 'سيارات بالأمانة', 'asset', false, v_inventory_id, 'سيارات محولة لمعارض أخرى'),
  (p_company_id, '1303', 'قطع الغيار والإكسسوارات', 'asset', false, v_inventory_id, 'قطع غيار وإكسسوارات');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '14', 'الأصول الثابتة', 'asset', false, v_assets_id, 'الممتلكات والمعدات')
  RETURNING id INTO v_fixed_assets_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1401', 'المباني والمعارض', 'asset', false, v_fixed_assets_id, 'مباني ومعارض مملوكة'),
  (p_company_id, '1402', 'الأثاث والتجهيزات', 'asset', false, v_fixed_assets_id, 'أثاث وتجهيزات المعرض'),
  (p_company_id, '1403', 'المركبات', 'asset', false, v_fixed_assets_id, 'مركبات الشركة'),
  (p_company_id, '1404', 'الأجهزة الإلكترونية', 'asset', false, v_fixed_assets_id, 'أجهزة كمبيوتر ومعدات'),
  (p_company_id, '1405', 'الإهلاك المتراكم', 'asset', false, v_fixed_assets_id, 'إجمالي الإهلاك المتراكم');

  -- 1108 ضريبة المدخلات
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1108', 'ضريبة القيمة المضافة - مدخلات', 'asset', true, v_assets_id, 'ضريبة المشتريات القابلة للاسترداد');

  -- 2 الخصوم
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '2', 'الخصوم', 'liability', true, 'إجمالي التزامات الشركة')
  RETURNING id INTO v_liabilities_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '21', 'الدائنون والذمم', 'liability', true, v_liabilities_id, 'المبالغ المستحقة للموردين والغير')
  RETURNING id INTO v_payables_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2101', 'الموردين', 'liability', true, v_payables_id, 'ذمم الموردين الدائنة'),
  (p_company_id, '2102', 'أوراق دفع', 'liability', false, v_payables_id, 'شيكات وكمبيالات مستحقة'),
  (p_company_id, '2103', 'مبالغ محتجزة للموردين', 'liability', false, v_payables_id, 'محتجزات ضمان الموردين');

  -- 2104 ضريبة المخرجات
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '2104', 'ضريبة القيمة المضافة', 'liability', true, v_payables_id, 'حسابات الضريبة')
  RETURNING id INTO v_vat_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '210401', 'ضريبة القيمة المضافة - مخرجات', 'liability', true, v_vat_id, 'ضريبة المبيعات المستحقة');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '22', 'التزامات أخرى', 'liability', false, v_liabilities_id, 'التزامات متنوعة')
  RETURNING id INTO v_other_liab_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2201', 'رواتب مستحقة', 'liability', false, v_other_liab_id, 'رواتب الموظفين المستحقة'),
  (p_company_id, '2202', 'مصروفات مستحقة', 'liability', false, v_other_liab_id, 'مصروفات مستحقة الدفع'),
  (p_company_id, '2203', 'إيرادات مقدمة', 'liability', false, v_other_liab_id, 'إيرادات مقبوضة مقدماً'),
  (p_company_id, '2204', 'جاري الشركاء', 'liability', false, v_other_liab_id, 'حسابات جارية للشركاء');

  -- 3 حقوق الملكية
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '3', 'حقوق الملكية', 'equity', true, 'حقوق ملاك الشركة')
  RETURNING id INTO v_equity_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '31', 'رأس المال', 'equity', true, v_equity_id, 'رأس مال الشركة')
  RETURNING id INTO v_capital_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '3101', 'رأس المال المدفوع', 'equity', true, v_capital_id, 'رأس المال المسجل'),
  (p_company_id, '3102', 'علاوة الإصدار', 'equity', false, v_capital_id, 'علاوة إصدار الأسهم');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '32', 'الاحتياطيات', 'equity', false, v_equity_id, 'احتياطيات الشركة'),
  (p_company_id, '3201', 'الاحتياطي النظامي', 'equity', false,
    (SELECT id FROM account_categories WHERE company_id = p_company_id AND code = '32' LIMIT 1), 'احتياطي نظامي 10%'),
  (p_company_id, '3202', 'الاحتياطي الاختياري', 'equity', false,
    (SELECT id FROM account_categories WHERE company_id = p_company_id AND code = '32' LIMIT 1), 'احتياطي اختياري');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '33', 'الأرباح المحتجزة', 'equity', true, v_equity_id, 'أرباح مبقاة من فترات سابقة'),
  (p_company_id, '3301', 'أرباح محتجزة', 'equity', true,
    (SELECT id FROM account_categories WHERE company_id = p_company_id AND code = '33' LIMIT 1), 'أرباح مبقاة'),
  (p_company_id, '3302', 'أرباح العام الحالي', 'equity', false,
    (SELECT id FROM account_categories WHERE company_id = p_company_id AND code = '33' LIMIT 1), 'صافي ربح/خسارة العام');

  -- 4 الإيرادات
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '4', 'الإيرادات', 'revenue', true, 'إجمالي إيرادات الشركة')
  RETURNING id INTO v_revenue_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '41', 'إيرادات المبيعات', 'revenue', true, v_revenue_id, 'إيرادات النشاط الرئيسي')
  RETURNING id INTO v_sales_rev_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '4101', 'مبيعات', 'revenue', true, v_sales_rev_id, 'إيرادات المبيعات الرئيسية'),
  (p_company_id, '4102', 'مبيعات خدمات', 'revenue', false, v_sales_rev_id, 'إيرادات الخدمات');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '42', 'إيرادات أخرى', 'revenue', false, v_revenue_id, 'إيرادات غير تشغيلية')
  RETURNING id INTO v_other_rev_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '4201', 'إيرادات استثمارية', 'revenue', false, v_other_rev_id, 'عوائد الاستثمارات'),
  (p_company_id, '4202', 'إيرادات متنوعة', 'revenue', false, v_other_rev_id, 'إيرادات أخرى متنوعة');

  -- 5 تكلفة المبيعات
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '5', 'تكلفة المبيعات', 'expense', true, 'تكاليف البضاعة المباعة')
  RETURNING id INTO v_cogs_root_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '51', 'تكلفة البضاعة المباعة', 'expense', true, v_cogs_root_id, 'التكلفة المباشرة للمبيعات')
  RETURNING id INTO v_cogs_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5101', 'تكلفة السيارات المباعة', 'expense', true, v_cogs_id, 'تكلفة شراء السيارات المباعة'),
  (p_company_id, '5102', 'تكلفة البضاعة المباعة', 'expense', false, v_cogs_id, 'تكلفة شراء البضائع المباعة'),
  (p_company_id, '5103', 'مصاريف الشحن والتوصيل', 'expense', false, v_cogs_id, 'تكاليف نقل البضائع');

  -- 6 المصروفات
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '6', 'المصروفات التشغيلية', 'expense', true, 'مصروفات تشغيل الشركة')
  RETURNING id INTO v_expenses_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '61', 'المصروفات الإدارية والعمومية', 'expense', true, v_expenses_id, 'مصروفات الإدارة العامة')
  RETURNING id INTO v_admin_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '6101', 'رواتب وأجور', 'expense', true, v_admin_exp_id, 'رواتب الموظفين'),
  (p_company_id, '6102', 'إيجارات', 'expense', false, v_admin_exp_id, 'إيجار المعرض والمكاتب'),
  (p_company_id, '6103', 'كهرباء وماء', 'expense', false, v_admin_exp_id, 'فواتير الخدمات'),
  (p_company_id, '6104', 'اتصالات', 'expense', false, v_admin_exp_id, 'هاتف وإنترنت'),
  (p_company_id, '6105', 'مستلزمات مكتبية', 'expense', false, v_admin_exp_id, 'قرطاسية ومستلزمات'),
  (p_company_id, '6106', 'صيانة وإصلاح', 'expense', false, v_admin_exp_id, 'صيانة المعدات والمباني'),
  (p_company_id, '6107', 'تأمين', 'expense', false, v_admin_exp_id, 'أقساط التأمين'),
  (p_company_id, '6108', 'رسوم حكومية', 'expense', false, v_admin_exp_id, 'رسوم ورخص حكومية'),
  (p_company_id, '6109', 'استشارات مهنية', 'expense', false, v_admin_exp_id, 'أتعاب محاماة ومحاسبة');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '62', 'مصروفات البيع والتسويق', 'expense', false, v_expenses_id, 'مصاريف المبيعات')
  RETURNING id INTO v_sales_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '6201', 'دعاية وإعلان', 'expense', false, v_sales_exp_id, 'تكاليف التسويق والإعلان'),
  (p_company_id, '6202', 'عمولات مبيعات', 'expense', false, v_sales_exp_id, 'عمولات مندوبي المبيعات');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '63', 'مصروفات أخرى', 'expense', false, v_expenses_id, 'مصروفات غير تشغيلية')
  RETURNING id INTO v_other_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '6301', 'مصاريف بنكية', 'expense', false, v_other_exp_id, 'عمولات ورسوم بنكية'),
  (p_company_id, '6302', 'خسائر متنوعة', 'expense', false, v_other_exp_id, 'خسائر أخرى'),
  (p_company_id, '6303', 'مخصص ديون مشكوك فيها', 'expense', false, v_other_exp_id, 'مخصص الذمم المعدومة'),
  (p_company_id, '6304', 'مصروفات الإهلاك', 'expense', false, v_other_exp_id, 'إهلاك الأصول الثابتة');

  -- Auto-populate account_mappings
  PERFORM populate_account_mappings(p_company_id);
END;
$$;