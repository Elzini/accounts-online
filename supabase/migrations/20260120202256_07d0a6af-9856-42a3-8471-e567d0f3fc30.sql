-- Update the create_default_accounts function for Saudi car dealerships
CREATE OR REPLACE FUNCTION public.create_default_accounts(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
  -- Check if accounts already exist
  IF EXISTS (SELECT 1 FROM account_categories WHERE company_id = p_company_id LIMIT 1) THEN
    RETURN;
  END IF;

  -- ==================== الأصول (Assets) ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '1', 'الأصول', 'assets', true, 'إجمالي أصول الشركة')
  RETURNING id INTO v_assets_id;

  -- النقدية والبنوك
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '11', 'النقدية والبنوك', 'assets', true, v_assets_id, 'حسابات النقدية والحسابات البنكية')
  RETURNING id INTO v_cash_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1101', 'الصندوق الرئيسي', 'assets', true, v_cash_id, 'النقدية في الصندوق'),
  (p_company_id, '1102', 'البنك - الحساب الجاري', 'assets', false, v_cash_id, 'الحساب الجاري في البنك'),
  (p_company_id, '1103', 'نقاط البيع (مدى)', 'assets', false, v_cash_id, 'مدفوعات نقاط البيع');

  -- الذمم المدينة
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '12', 'الذمم المدينة', 'assets', true, v_assets_id, 'المبالغ المستحقة من العملاء')
  RETURNING id INTO v_receivables_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1201', 'العملاء', 'assets', true, v_receivables_id, 'ذمم العملاء المدينة'),
  (p_company_id, '1202', 'شيكات تحت التحصيل', 'assets', false, v_receivables_id, 'شيكات مؤجلة من العملاء'),
  (p_company_id, '1203', 'أقساط مستحقة', 'assets', false, v_receivables_id, 'أقساط مبيعات التقسيط'),
  (p_company_id, '1204', 'سلف الموظفين', 'assets', false, v_receivables_id, 'سلف مقدمة للموظفين');

  -- المخزون
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '13', 'المخزون', 'assets', true, v_assets_id, 'مخزون السيارات والبضائع')
  RETURNING id INTO v_inventory_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1301', 'مخزون السيارات', 'assets', true, v_inventory_id, 'السيارات المتاحة للبيع'),
  (p_company_id, '1302', 'سيارات بالأمانة', 'assets', false, v_inventory_id, 'سيارات محولة لمعارض أخرى'),
  (p_company_id, '1303', 'قطع الغيار والإكسسوارات', 'assets', false, v_inventory_id, 'قطع غيار وإكسسوارات');

  -- الأصول الثابتة
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '14', 'الأصول الثابتة', 'assets', false, v_assets_id, 'الممتلكات والمعدات')
  RETURNING id INTO v_fixed_assets_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1401', 'المباني والمعارض', 'assets', false, v_fixed_assets_id, 'مباني ومعارض مملوكة'),
  (p_company_id, '1402', 'الأثاث والتجهيزات', 'assets', false, v_fixed_assets_id, 'أثاث وتجهيزات المعرض'),
  (p_company_id, '1403', 'المركبات', 'assets', false, v_fixed_assets_id, 'مركبات الشركة'),
  (p_company_id, '1404', 'أجهزة الحاسب والمعدات', 'assets', false, v_fixed_assets_id, 'أجهزة حاسب ومعدات'),
  (p_company_id, '1490', 'مجمع الإهلاك', 'assets', false, v_fixed_assets_id, 'مجمع إهلاك الأصول الثابتة');

  -- ==================== الخصوم (Liabilities) ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '2', 'الخصوم', 'liabilities', true, null, 'إجمالي التزامات الشركة')
  RETURNING id INTO v_liabilities_id;

  -- الذمم الدائنة
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '21', 'الذمم الدائنة', 'liabilities', true, v_liabilities_id, 'المبالغ المستحقة للموردين')
  RETURNING id INTO v_payables_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2101', 'الموردون', 'liabilities', true, v_payables_id, 'ذمم الموردين الدائنة'),
  (p_company_id, '2102', 'شيكات مؤجلة للموردين', 'liabilities', false, v_payables_id, 'شيكات صادرة مؤجلة'),
  (p_company_id, '2103', 'أمانات سيارات (واردة)', 'liabilities', false, v_payables_id, 'سيارات مستلمة بالأمانة من معارض أخرى');

  -- ضريبة القيمة المضافة
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '22', 'ضريبة القيمة المضافة', 'liabilities', true, v_liabilities_id, 'حسابات ضريبة القيمة المضافة')
  RETURNING id INTO v_vat_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2201', 'ضريبة القيمة المضافة المستحقة', 'liabilities', true, v_vat_id, 'ضريبة مستحقة على المبيعات'),
  (p_company_id, '2202', 'ضريبة القيمة المضافة المستردة', 'liabilities', true, v_vat_id, 'ضريبة قابلة للاسترداد على المشتريات');

  -- مستحقات أخرى
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '23', 'مستحقات أخرى', 'liabilities', false, v_liabilities_id, 'التزامات أخرى')
  RETURNING id INTO v_other_liab_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2301', 'مستحقات الموظفين', 'liabilities', false, v_other_liab_id, 'رواتب ومستحقات موظفين'),
  (p_company_id, '2302', 'التأمينات الاجتماعية', 'liabilities', false, v_other_liab_id, 'اشتراكات التأمينات'),
  (p_company_id, '2303', 'عربون مقدم من العملاء', 'liabilities', false, v_other_liab_id, 'عربون مستلم لحجز سيارة');

  -- ==================== حقوق الملكية (Equity) ====================
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

  -- ==================== الإيرادات (Revenue) ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '4', 'الإيرادات', 'revenue', true, null, 'إجمالي إيرادات الشركة')
  RETURNING id INTO v_revenue_id;

  -- إيرادات المبيعات
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '41', 'إيرادات المبيعات', 'revenue', true, v_revenue_id, 'إيرادات بيع السيارات')
  RETURNING id INTO v_sales_rev_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '4101', 'مبيعات السيارات الجديدة', 'revenue', true, v_sales_rev_id, 'مبيعات سيارات جديدة'),
  (p_company_id, '4102', 'مبيعات السيارات المستعملة', 'revenue', true, v_sales_rev_id, 'مبيعات سيارات مستعملة'),
  (p_company_id, '4103', 'مبيعات قطع الغيار', 'revenue', false, v_sales_rev_id, 'مبيعات قطع غيار وإكسسوارات');

  -- إيرادات أخرى
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '42', 'إيرادات أخرى', 'revenue', false, v_revenue_id, 'إيرادات غير المبيعات')
  RETURNING id INTO v_other_rev_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '4201', 'إيرادات العمولات', 'revenue', true, v_other_rev_id, 'عمولات وساطة بيع'),
  (p_company_id, '4202', 'إيرادات نقل الملكية', 'revenue', false, v_other_rev_id, 'رسوم نقل ملكية'),
  (p_company_id, '4203', 'إيرادات التأمين', 'revenue', false, v_other_rev_id, 'عمولات وساطة تأمين'),
  (p_company_id, '4204', 'إيرادات متنوعة', 'revenue', false, v_other_rev_id, 'إيرادات أخرى متنوعة');

  -- ==================== المصروفات (Expenses) ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '5', 'المصروفات', 'expenses', true, null, 'إجمالي مصروفات الشركة')
  RETURNING id INTO v_expenses_id;

  -- تكلفة البضاعة المباعة
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '51', 'تكلفة البضاعة المباعة', 'expenses', true, v_expenses_id, 'تكلفة السيارات المباعة')
  RETURNING id INTO v_cogs_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5101', 'تكلفة السيارات المباعة', 'expenses', true, v_cogs_id, 'تكلفة شراء السيارات المباعة'),
  (p_company_id, '5102', 'مصاريف تجهيز السيارات', 'expenses', false, v_cogs_id, 'تنظيف وتلميع وصيانة للبيع');

  -- المصروفات الإدارية
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '52', 'المصروفات الإدارية والعمومية', 'expenses', true, v_expenses_id, 'مصاريف الإدارة العامة')
  RETURNING id INTO v_admin_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5201', 'الرواتب والأجور', 'expenses', true, v_admin_exp_id, 'رواتب وأجور الموظفين'),
  (p_company_id, '5202', 'إيجار المعرض', 'expenses', false, v_admin_exp_id, 'إيجار المعرض والمكاتب'),
  (p_company_id, '5203', 'الكهرباء والماء', 'expenses', false, v_admin_exp_id, 'فواتير كهرباء وماء'),
  (p_company_id, '5204', 'الاتصالات والإنترنت', 'expenses', false, v_admin_exp_id, 'فواتير اتصالات'),
  (p_company_id, '5205', 'صيانة المعرض', 'expenses', false, v_admin_exp_id, 'صيانة ونظافة المعرض'),
  (p_company_id, '5206', 'التأمينات الاجتماعية', 'expenses', false, v_admin_exp_id, 'حصة الشركة في التأمينات'),
  (p_company_id, '5207', 'رسوم حكومية وتراخيص', 'expenses', false, v_admin_exp_id, 'رسوم رخص ورسوم حكومية'),
  (p_company_id, '5208', 'مستلزمات مكتبية', 'expenses', false, v_admin_exp_id, 'قرطاسية ومستلزمات');

  -- مصروفات البيع
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '53', 'مصروفات البيع والتسويق', 'expenses', false, v_expenses_id, 'مصاريف المبيعات')
  RETURNING id INTO v_sales_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5301', 'عمولات البيع', 'expenses', true, v_sales_exp_id, 'عمولات مندوبي المبيعات'),
  (p_company_id, '5302', 'الإعلان والتسويق', 'expenses', false, v_sales_exp_id, 'مصاريف إعلانات'),
  (p_company_id, '5303', 'مصاريف نقل الملكية', 'expenses', false, v_sales_exp_id, 'رسوم نقل ملكية للعميل'),
  (p_company_id, '5304', 'مصاريف الضمان', 'expenses', false, v_sales_exp_id, 'تكاليف ضمان ما بعد البيع');

  -- مصروفات أخرى
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '54', 'مصروفات أخرى', 'expenses', false, v_expenses_id, 'مصروفات متنوعة')
  RETURNING id INTO v_other_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5401', 'مصروفات الإهلاك', 'expenses', false, v_other_exp_id, 'إهلاك الأصول الثابتة'),
  (p_company_id, '5402', 'مصروفات بنكية', 'expenses', false, v_other_exp_id, 'عمولات ورسوم بنكية'),
  (p_company_id, '5403', 'غرامات وجزاءات', 'expenses', false, v_other_exp_id, 'غرامات وتأخير'),
  (p_company_id, '5404', 'ديون معدومة', 'expenses', false, v_other_exp_id, 'ديون غير قابلة للتحصيل'),
  (p_company_id, '5405', 'مصروفات متنوعة', 'expenses', false, v_other_exp_id, 'مصروفات أخرى');

END;
$$;