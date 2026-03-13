CREATE OR REPLACE FUNCTION public.create_real_estate_accounts(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assets_id uuid;
  v_current_assets_id uuid;
  v_cash_id uuid;
  v_banks_id uuid;
  v_customers_id uuid;
  v_receivables_id uuid;
  v_vat_input_id uuid;
  v_prepaid_id uuid;
  v_advances_id uuid;
  v_inventory_id uuid;
  v_land_id uuid;
  v_projects_dev_id uuid;
  v_finishing_id uuid;
  v_materials_id uuid;
  v_ready_units_id uuid;
  v_reserved_units_id uuid;
  v_fixed_assets_id uuid;
  v_depreciation_id uuid;
  v_intangible_id uuid;
  v_other_assets_id uuid;
  v_investments_id uuid;
  v_licenses_id uuid;
  v_liabilities_id uuid;
  v_current_liab_id uuid;
  v_suppliers_id uuid;
  v_customer_advances_id uuid;
  v_notes_payable_id uuid;
  v_long_term_liab_id uuid;
  v_equity_id uuid;
  v_revenue_id uuid;
  v_cogs_id uuid;
  v_opex_id uuid;
  v_admin_exp_id uuid;
  v_marketing_exp_id uuid;
  v_other_opex_id uuid;
  v_finance_exp_id uuid;
  v_impairment_id uuid;
BEGIN
  -- ==================== 1000 الأصول ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '1000', 'الأصول', 'assets', true, 'إجمالي أصول الشركة')
  RETURNING id INTO v_assets_id;

  -- === 1100 الأصول المتداولة ===
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1100', 'الأصول المتداولة', 'assets', true, v_assets_id, 'الأصول المتداولة')
  RETURNING id INTO v_current_assets_id;

  -- 1110 الصندوق
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1110', 'الصندوق', 'assets', true, v_current_assets_id, 'حسابات الصندوق النقدي')
  RETURNING id INTO v_cash_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1111', 'صندوق رئيسي', 'assets', true, v_cash_id, 'الصندوق النقدي الرئيسي'),
  (p_company_id, '1112', 'صندوق الموقع', 'assets', false, v_cash_id, 'صندوق نقدي في موقع المشروع');

  -- 1120 البنوك
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1120', 'البنوك', 'assets', true, v_current_assets_id, 'الحسابات البنكية')
  RETURNING id INTO v_banks_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1121', 'بنك – حساب جاري', 'assets', true, v_banks_id, 'الحساب الجاري في البنك'),
  (p_company_id, '1122', 'بنك – حساب المشاريع', 'assets', false, v_banks_id, 'حساب بنكي مخصص للمشاريع'),
  (p_company_id, '1123', 'بنك – حساب الضمانات', 'assets', false, v_banks_id, 'حساب ضمان المشاريع - Escrow'),
  (p_company_id, '1124', 'بنك – حساب الدفعات المقدمة', 'assets', false, v_banks_id, 'حساب الدفعات المقدمة من العملاء'),
  (p_company_id, '1125', 'بنك – حساب وافي (Escrow)', 'assets', false, v_banks_id, 'حساب ضمان البيع على الخارطة - وافي');

  -- 1130 العملاء
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1130', 'العملاء', 'assets', true, v_current_assets_id, 'ذمم العملاء المدينة')
  RETURNING id INTO v_customers_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1131', 'عملاء بيع شقق', 'assets', true, v_customers_id, 'ذمم عملاء شراء شقق'),
  (p_company_id, '1132', 'عملاء بيع فلل', 'assets', false, v_customers_id, 'ذمم عملاء شراء فلل'),
  (p_company_id, '1133', 'عملاء بيع أراضي', 'assets', false, v_customers_id, 'ذمم عملاء شراء أراضي'),
  (p_company_id, '1134', 'عملاء حجز وحدات', 'assets', false, v_customers_id, 'ذمم عملاء حجز وحدات'),
  (p_company_id, '1135', 'عملاء بيع تجاري', 'assets', false, v_customers_id, 'ذمم عملاء وحدات تجارية'),
  (p_company_id, '1136', 'عملاء بيع عمائر', 'assets', false, v_customers_id, 'ذمم عملاء شراء عمائر');

  -- 1140 أوراق قبض
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1140', 'أوراق قبض', 'assets', true, v_current_assets_id, 'أوراق القبض والشيكات')
  RETURNING id INTO v_receivables_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1141', 'شيكات تحت التحصيل', 'assets', true, v_receivables_id, 'شيكات مؤجلة من العملاء'),
  (p_company_id, '1142', 'كمبيالات', 'assets', false, v_receivables_id, 'كمبيالات مستحقة'),
  (p_company_id, '1143', 'ضمانات بنكية مقدمة', 'assets', false, v_receivables_id, 'خطابات ضمان بنكية');

  -- 1150 دفعات مقدمة للموردين
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1150', 'دفعات مقدمة للموردين', 'assets', true, v_current_assets_id, 'دفعات مسبقة لمقاولي وموردي البناء')
  RETURNING id INTO v_advances_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1151', 'دفعات مقدمة لمقاولين', 'assets', false, v_advances_id, 'دفعات مسبقة للمقاولين'),
  (p_company_id, '1152', 'دفعات مقدمة لموردي مواد', 'assets', false, v_advances_id, 'دفعات مسبقة لموردي مواد البناء');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1160', 'عهد موظفين', 'assets', false, v_current_assets_id, 'عهد نقدية لدى الموظفين'),
  (p_company_id, '1170', 'ذمم موظفين', 'assets', false, v_current_assets_id, 'سلف وذمم مستحقة على الموظفين');

  -- 1180 ضريبة قيمة مضافة قابلة للاسترداد
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1180', 'ضريبة قيمة مضافة قابلة للاسترداد', 'assets', true, v_current_assets_id, 'ضريبة المدخلات القابلة للاسترداد - Input VAT')
  RETURNING id INTO v_vat_input_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1181', 'ضريبة مدخلات مشاريع', 'assets', true, v_vat_input_id, 'ضريبة مدخلات على تكاليف المشاريع العقارية'),
  (p_company_id, '1182', 'ضريبة مدخلات إدارية', 'assets', false, v_vat_input_id, 'ضريبة مدخلات على المصروفات الإدارية'),
  (p_company_id, '1183', 'ضريبة مدخلات مقاولين', 'assets', false, v_vat_input_id, 'ضريبة مدخلات على مستخلصات المقاولين'),
  (p_company_id, '1184', 'ضريبة تصرفات عقارية مدفوعة', 'assets', false, v_vat_input_id, 'ضريبة RETT 5% مدفوعة عند شراء أراضي ووحدات'),
  (p_company_id, '1185', 'ضريبة مدخلات أصول ثابتة', 'assets', false, v_vat_input_id, 'ضريبة مدخلات على مشتريات الأصول الثابتة');

  -- 1190 مصروفات مدفوعة مقدماً
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1190', 'مصروفات مدفوعة مقدماً', 'assets', false, v_current_assets_id, 'مصروفات مدفوعة مقدماً')
  RETURNING id INTO v_prepaid_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1191', 'إيجار مدفوع مقدماً', 'assets', false, v_prepaid_id, 'إيجار مكاتب مدفوع مقدماً'),
  (p_company_id, '1192', 'تأمين مدفوع مقدماً', 'assets', false, v_prepaid_id, 'أقساط تأمين مدفوعة مقدماً'),
  (p_company_id, '1193', 'رخص تجارية مدفوعة مقدماً', 'assets', false, v_prepaid_id, 'رخص تجارية مدفوعة مقدماً');

  -- === 1200 المخزون العقاري ===
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1200', 'المخزون العقاري', 'assets', true, v_assets_id, 'الأصول العقارية قيد التطوير والجاهزة للبيع')
  RETURNING id INTO v_inventory_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1210', 'أراضي مشاريع', 'assets', true, v_inventory_id, 'أراضي مخصصة للتطوير')
  RETURNING id INTO v_land_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1211', 'أرض مشروع 1', 'assets', false, v_land_id, 'تكلفة أرض المشروع الأول'),
  (p_company_id, '1212', 'أرض مشروع 2', 'assets', false, v_land_id, 'تكلفة أرض المشروع الثاني');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1220', 'مشاريع تحت التطوير', 'assets', true, v_inventory_id, 'تكاليف المشاريع قيد الإنشاء')
  RETURNING id INTO v_projects_dev_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1221', 'تكلفة الأرض', 'assets', true, v_projects_dev_id, 'تكلفة الأرض المحملة على المشروع'),
  (p_company_id, '1222', 'أعمال الحفر', 'assets', false, v_projects_dev_id, 'تكاليف حفر وتسوية الأرض'),
  (p_company_id, '1223', 'أعمال الأساسات', 'assets', false, v_projects_dev_id, 'تكاليف الأساسات والقواعد'),
  (p_company_id, '1224', 'الهيكل الإنشائي', 'assets', false, v_projects_dev_id, 'تكاليف الهيكل الخرساني'),
  (p_company_id, '1225', 'أعمال الخرسانة', 'assets', false, v_projects_dev_id, 'تكاليف أعمال الخرسانة'),
  (p_company_id, '1226', 'أعمال البناء', 'assets', false, v_projects_dev_id, 'تكاليف أعمال البناء العامة'),
  (p_company_id, '1227', 'الكهرباء', 'assets', false, v_projects_dev_id, 'تكاليف التمديدات الكهربائية'),
  (p_company_id, '1228', 'السباكة', 'assets', false, v_projects_dev_id, 'تكاليف أعمال السباكة'),
  (p_company_id, '1229', 'التكييف', 'assets', false, v_projects_dev_id, 'تكاليف أنظمة التكييف');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1230', 'التشطيبات', 'assets', false, v_projects_dev_id, 'تكاليف التشطيبات')
  RETURNING id INTO v_finishing_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1231', 'تشطيبات داخلية', 'assets', false, v_finishing_id, 'بلاط وأرضيات وأسقف مستعارة'),
  (p_company_id, '1232', 'تشطيبات خارجية', 'assets', false, v_finishing_id, 'واجهات وحجر ورخام'),
  (p_company_id, '1233', 'دهانات', 'assets', false, v_finishing_id, 'دهانات داخلية وخارجية'),
  (p_company_id, '1234', 'أعمال ألمنيوم وزجاج', 'assets', false, v_finishing_id, 'نوافذ وأبواب ألمنيوم وزجاج');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1240', 'المصاعد', 'assets', false, v_projects_dev_id, 'تكاليف المصاعد'),
  (p_company_id, '1241', 'أنظمة السلامة', 'assets', false, v_projects_dev_id, 'أنظمة الأمان والسلامة'),
  (p_company_id, '1242', 'أنظمة الحريق', 'assets', false, v_projects_dev_id, 'أنظمة إطفاء ومكافحة الحريق'),
  (p_company_id, '1243', 'تنسيق حدائق ومسطحات خضراء', 'assets', false, v_projects_dev_id, 'تكاليف تنسيق المواقع والحدائق'),
  (p_company_id, '1244', 'أنظمة ذكية وأتمتة المباني', 'assets', false, v_projects_dev_id, 'أنظمة المنزل الذكي والأتمتة'),
  (p_company_id, '1245', 'أعمال البنية التحتية', 'assets', false, v_projects_dev_id, 'طرق ومواقف وإنارة'),
  (p_company_id, '1246', 'شبكات الصرف الصحي والأمطار', 'assets', false, v_projects_dev_id, 'شبكات الصرف'),
  (p_company_id, '1250', 'الإشراف الهندسي', 'assets', false, v_projects_dev_id, 'أتعاب الإشراف الهندسي'),
  (p_company_id, '1251', 'استشارات هندسية', 'assets', false, v_projects_dev_id, 'أتعاب استشارات هندسية'),
  (p_company_id, '1252', 'مخططات وتصميم', 'assets', false, v_projects_dev_id, 'تكاليف المخططات والتصاميم المعمارية'),
  (p_company_id, '1253', 'فحوصات تربة واختبارات', 'assets', false, v_projects_dev_id, 'فحوصات جيوتقنية واختبارات معملية');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1260', 'تراخيص البلدية', 'assets', false, v_projects_dev_id, 'رسوم التراخيص الحكومية')
  RETURNING id INTO v_licenses_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1261', 'رسوم رخص البناء', 'assets', false, v_licenses_id, 'رسوم إصدار رخص البناء'),
  (p_company_id, '1262', 'رسوم الخدمات', 'assets', false, v_licenses_id, 'رسوم إيصال خدمات كهرباء وماء'),
  (p_company_id, '1263', 'رسوم إيصال كهرباء', 'assets', false, v_licenses_id, 'رسوم إيصال الكهرباء من SEC'),
  (p_company_id, '1264', 'رسوم إيصال مياه وصرف', 'assets', false, v_licenses_id, 'رسوم إيصال المياه والصرف من NWC');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1270', 'مواد بناء للمشاريع', 'assets', true, v_inventory_id, 'مخزون مواد البناء')
  RETURNING id INTO v_materials_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1271', 'حديد', 'assets', false, v_materials_id, 'مخزون حديد التسليح'),
  (p_company_id, '1272', 'أسمنت', 'assets', false, v_materials_id, 'مخزون الأسمنت'),
  (p_company_id, '1273', 'مواد كهرباء', 'assets', false, v_materials_id, 'مخزون مواد كهربائية'),
  (p_company_id, '1274', 'مواد سباكة', 'assets', false, v_materials_id, 'مخزون مواد سباكة'),
  (p_company_id, '1275', 'خرسانة جاهزة', 'assets', false, v_materials_id, 'مخزون خرسانة جاهزة'),
  (p_company_id, '1276', 'مواد تشطيب', 'assets', false, v_materials_id, 'مخزون مواد تشطيب');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1280', 'وحدات جاهزة للبيع', 'assets', true, v_inventory_id, 'وحدات مكتملة وجاهزة للبيع')
  RETURNING id INTO v_ready_units_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1281', 'شقق جاهزة للبيع', 'assets', false, v_ready_units_id, 'شقق مكتملة ومعروضة للبيع'),
  (p_company_id, '1282', 'فلل جاهزة للبيع', 'assets', false, v_ready_units_id, 'فلل مكتملة ومعروضة للبيع'),
  (p_company_id, '1283', 'أراضي جاهزة للبيع', 'assets', false, v_ready_units_id, 'أراضي مطورة جاهزة للبيع'),
  (p_company_id, '1284', 'وحدات تجارية جاهزة للبيع', 'assets', false, v_ready_units_id, 'محلات ومكاتب تجارية جاهزة'),
  (p_company_id, '1285', 'عمائر جاهزة للبيع', 'assets', false, v_ready_units_id, 'عمائر مكتملة ومعروضة للبيع');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1290', 'وحدات محجوزة للعملاء', 'assets', false, v_inventory_id, 'وحدات تم حجزها من قبل عملاء');

  -- === 1300 الأصول الثابتة ===
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1300', 'الأصول الثابتة', 'assets', true, v_assets_id, 'الممتلكات والمعدات')
  RETURNING id INTO v_fixed_assets_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1310', 'مباني إدارية', 'assets', false, v_fixed_assets_id, 'مباني ومكاتب الشركة'),
  (p_company_id, '1320', 'سيارات', 'assets', false, v_fixed_assets_id, 'مركبات الشركة'),
  (p_company_id, '1330', 'أثاث مكتبي', 'assets', false, v_fixed_assets_id, 'أثاث وتجهيزات المكاتب'),
  (p_company_id, '1340', 'أجهزة كمبيوتر', 'assets', false, v_fixed_assets_id, 'أجهزة حاسب ومعدات تقنية'),
  (p_company_id, '1350', 'معدات مواقع', 'assets', false, v_fixed_assets_id, 'معدات ثقيلة للمواقع');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1360', 'مجمع الإهلاك', 'assets', true, v_fixed_assets_id, 'مجمع إهلاك الأصول الثابتة')
  RETURNING id INTO v_depreciation_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1361', 'مجمع إهلاك مباني', 'assets', false, v_depreciation_id, 'إهلاك متراكم للمباني الإدارية'),
  (p_company_id, '1362', 'مجمع إهلاك سيارات', 'assets', false, v_depreciation_id, 'إهلاك متراكم للسيارات'),
  (p_company_id, '1363', 'مجمع إهلاك أثاث', 'assets', false, v_depreciation_id, 'إهلاك متراكم للأثاث المكتبي'),
  (p_company_id, '1364', 'مجمع إهلاك أجهزة', 'assets', false, v_depreciation_id, 'إهلاك متراكم لأجهزة الكمبيوتر'),
  (p_company_id, '1365', 'مجمع إهلاك معدات', 'assets', false, v_depreciation_id, 'إهلاك متراكم لمعدات المواقع');

  -- أصول غير ملموسة
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1370', 'أصول غير ملموسة', 'assets', false, v_fixed_assets_id, 'أصول غير ملموسة')
  RETURNING id INTO v_intangible_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1371', 'برمجيات وأنظمة', 'assets', false, v_intangible_id, 'برمجيات وأنظمة إدارة'),
  (p_company_id, '1372', 'حقوق انتفاع', 'assets', false, v_intangible_id, 'حقوق انتفاع عقارية');

  -- === 1400 أصول أخرى ===
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1400', 'أصول أخرى', 'assets', false, v_assets_id, 'أصول متنوعة')
  RETURNING id INTO v_other_assets_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1410', 'تأمينات مستردة', 'assets', false, v_other_assets_id, 'تأمينات لدى جهات حكومية قابلة للاسترداد');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '1420', 'استثمارات طويلة الأجل', 'assets', false, v_other_assets_id, 'استثمارات في مشاريع عقارية أخرى')
  RETURNING id INTO v_investments_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1421', 'استثمارات في شركات تابعة', 'assets', false, v_investments_id, 'حصص في شركات تابعة'),
  (p_company_id, '1422', 'استثمارات في مشاريع مشتركة', 'assets', false, v_investments_id, 'حصص في مشاريع عقارية مشتركة');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '1430', 'مصروفات تأسيس', 'assets', false, v_other_assets_id, 'مصروفات تأسيس الشركة'),
  (p_company_id, '1440', 'شهرة محل', 'assets', false, v_other_assets_id, 'شهرة ناتجة عن استحواذ');

  -- ==================== 2000 الخصوم ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '2000', 'الخصوم', 'liabilities', true, 'إجمالي التزامات الشركة')
  RETURNING id INTO v_liabilities_id;

  -- === 2100 الخصوم المتداولة ===
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '2100', 'الخصوم المتداولة', 'liabilities', true, v_liabilities_id, 'الالتزامات قصيرة الأجل')
  RETURNING id INTO v_current_liab_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '2110', 'الموردون', 'liabilities', true, v_current_liab_id, 'ذمم الموردين والمقاولين')
  RETURNING id INTO v_suppliers_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2111', 'موردو مواد البناء', 'liabilities', true, v_suppliers_id, 'ذمم موردي مواد البناء'),
  (p_company_id, '2112', 'مقاولون', 'liabilities', true, v_suppliers_id, 'مستحقات المقاولين'),
  (p_company_id, '2113', 'موردو خدمات هندسية', 'liabilities', false, v_suppliers_id, 'مستحقات مكاتب هندسية'),
  (p_company_id, '2114', 'مقاولو باطن', 'liabilities', false, v_suppliers_id, 'مستحقات مقاولي الباطن'),
  (p_company_id, '2115', 'محتجزات ضمان مقاولين', 'liabilities', false, v_suppliers_id, 'نسبة 5-10% محتجزة من مستخلصات المقاولين كضمان');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '2120', 'دفعات مقدمة من العملاء', 'liabilities', true, v_current_liab_id, 'دفعات مسبقة من المشترين')
  RETURNING id INTO v_customer_advances_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2121', 'دفعات حجز وحدات', 'liabilities', true, v_customer_advances_id, 'دفعات حجز وحدات عقارية'),
  (p_company_id, '2122', 'دفعات بيع على الخارطة (وافي)', 'liabilities', false, v_customer_advances_id, 'دفعات عقود البيع على الخارطة - WAFI'),
  (p_company_id, '2123', 'أقساط عملاء مقدمة', 'liabilities', false, v_customer_advances_id, 'أقساط مسددة مقدماً من العملاء');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2130', 'رواتب مستحقة', 'liabilities', true, v_current_liab_id, 'رواتب وأجور مستحقة للموظفين'),
  (p_company_id, '2140', 'مصروفات مستحقة', 'liabilities', false, v_current_liab_id, 'مصروفات مستحقة وغير مدفوعة');

  -- أوراق دفع
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '2145', 'أوراق دفع', 'liabilities', false, v_current_liab_id, 'شيكات وكمبيالات مستحقة للموردين')
  RETURNING id INTO v_notes_payable_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2146', 'شيكات مؤجلة للموردين', 'liabilities', false, v_notes_payable_id, 'شيكات مؤجلة صادرة للموردين');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2150', 'ضريبة القيمة المضافة المستحقة', 'liabilities', true, v_current_liab_id, 'ضريبة مخرجات مستحقة لـ ZATCA - Output VAT 15%'),
  (p_company_id, '2155', 'حساب تسوية ضريبة القيمة المضافة', 'liabilities', true, v_current_liab_id, 'تسوية الضريبة مع هيئة الزكاة والضريبة'),
  (p_company_id, '2156', 'ضريبة التصرفات العقارية المستحقة', 'liabilities', true, v_current_liab_id, 'ضريبة RETT 5% مستحقة على بيع العقارات والأراضي'),
  (p_company_id, '2157', 'إعفاء المسكن الأول - وزارة الإسكان', 'liabilities', false, v_current_liab_id, 'مبالغ تتحملها الدولة عن المسكن الأول حتى مليون ريال - برنامج سكني'),
  (p_company_id, '2160', 'التأمينات الاجتماعية', 'liabilities', false, v_current_liab_id, 'اشتراكات GOSI المستحقة'),
  (p_company_id, '2170', 'جاري الشركاء', 'liabilities', false, v_current_liab_id, 'حساب جاري الشركاء'),
  (p_company_id, '2180', 'مخصص الزكاة', 'liabilities', true, v_current_liab_id, 'مخصص زكاة مستحق - 2.5% من الوعاء الزكوي'),
  (p_company_id, '2190', 'مخصص مكافأة نهاية الخدمة', 'liabilities', true, v_current_liab_id, 'مخصص مكافأة نهاية خدمة الموظفين حسب نظام العمل'),
  (p_company_id, '2191', 'مخصص ضمان صيانة', 'liabilities', false, v_current_liab_id, 'مخصص ضمان صيانة الوحدات المباعة'),
  (p_company_id, '2192', 'مخصص خسائر متوقعة', 'liabilities', false, v_current_liab_id, 'مخصص خسائر متوقعة على المشاريع');

  -- === 2200 خصوم طويلة الأجل ===
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '2200', 'خصوم طويلة الأجل', 'liabilities', false, v_liabilities_id, 'التزامات طويلة الأجل')
  RETURNING id INTO v_long_term_liab_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '2210', 'قروض بنكية طويلة الأجل', 'liabilities', false, v_long_term_liab_id, 'قروض بنكية لأكثر من سنة'),
  (p_company_id, '2220', 'تمويل مشاريع', 'liabilities', false, v_long_term_liab_id, 'تمويل من صناديق تنمية عقارية'),
  (p_company_id, '2225', 'مرابحة عقارية', 'liabilities', false, v_long_term_liab_id, 'تمويل إسلامي - مرابحة عقارية'),
  (p_company_id, '2230', 'التزامات عقود التمويل', 'liabilities', false, v_long_term_liab_id, 'التزامات عقود إيجار تمويلي'),
  (p_company_id, '2235', 'تمويل صندوق التنمية العقاري', 'liabilities', false, v_long_term_liab_id, 'تمويل من صندوق التنمية العقاري'),
  (p_company_id, '2240', 'صكوك تمويل', 'liabilities', false, v_long_term_liab_id, 'صكوك إسلامية لتمويل المشاريع');

  -- ==================== 3000 حقوق الملكية ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '3000', 'حقوق الملكية', 'equity', true, 'حقوق ملاك الشركة')
  RETURNING id INTO v_equity_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '3100', 'رأس المال', 'equity', true, v_equity_id, 'رأس مال الشركة المسجل'),
  (p_company_id, '3110', 'احتياطي نظامي', 'equity', false, v_equity_id, 'احتياطي نظامي 10% من صافي الربح'),
  (p_company_id, '3120', 'احتياطي اختياري', 'equity', false, v_equity_id, 'احتياطي اختياري'),
  (p_company_id, '3130', 'الأرباح المبقاة', 'equity', true, v_equity_id, 'أرباح محتجزة من سنوات سابقة'),
  (p_company_id, '3140', 'صافي الربح أو الخسارة', 'equity', true, v_equity_id, 'نتيجة العام الحالي'),
  (p_company_id, '3150', 'جاري المالك', 'equity', false, v_equity_id, 'حساب جاري المالك / الشركاء'),
  (p_company_id, '3160', 'أرباح موزعة', 'equity', false, v_equity_id, 'توزيعات أرباح على الملاك');

  -- ==================== 4000 الإيرادات ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '4000', 'الإيرادات', 'revenue', true, 'إجمالي إيرادات الشركة')
  RETURNING id INTO v_revenue_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '4100', 'إيرادات بيع أراضي', 'revenue', true, v_revenue_id, 'إيرادات بيع أراضي مطورة'),
  (p_company_id, '4110', 'إيرادات بيع شقق', 'revenue', true, v_revenue_id, 'إيرادات بيع وحدات سكنية - شقق'),
  (p_company_id, '4120', 'إيرادات بيع فلل', 'revenue', false, v_revenue_id, 'إيرادات بيع فلل ودوبلكس'),
  (p_company_id, '4130', 'إيرادات بيع عمائر', 'revenue', false, v_revenue_id, 'إيرادات بيع عمائر تجارية وسكنية'),
  (p_company_id, '4140', 'إيرادات خدمات تطوير', 'revenue', false, v_revenue_id, 'إيرادات خدمات التطوير العقاري للغير'),
  (p_company_id, '4150', 'إيرادات إيجار مؤقت', 'revenue', false, v_revenue_id, 'إيرادات تأجير وحدات قبل البيع'),
  (p_company_id, '4160', 'إيرادات أخرى', 'revenue', false, v_revenue_id, 'إيرادات متنوعة أخرى'),
  (p_company_id, '4170', 'إيرادات إدارة أملاك', 'revenue', false, v_revenue_id, 'إيرادات خدمات إدارة الأملاك للغير'),
  (p_company_id, '4180', 'إيرادات وساطة عقارية', 'revenue', false, v_revenue_id, 'عمولات وساطة في بيع وشراء العقارات'),
  (p_company_id, '4190', 'إيرادات بيع وحدات تجارية', 'revenue', false, v_revenue_id, 'إيرادات بيع محلات ومكاتب تجارية'),
  (p_company_id, '4200', 'إيرادات استثمارية', 'revenue', false, v_revenue_id, 'إيرادات من استثمارات ومساهمات'),
  (p_company_id, '4210', 'إيرادات مرابحات تمويلية', 'revenue', false, v_revenue_id, 'إيرادات تمويل عملاء بنظام المرابحة'),
  (p_company_id, '4900', 'خصومات مبيعات', 'revenue', false, v_revenue_id, 'خصومات ممنوحة للعملاء'),
  (p_company_id, '4910', 'مردودات مبيعات', 'revenue', false, v_revenue_id, 'إلغاءات وفسوخ عقود بيع');

  -- ==================== 5000 تكلفة المبيعات ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '5000', 'تكلفة المبيعات', 'expenses', true, 'تكلفة الوحدات والأراضي المباعة')
  RETURNING id INTO v_cogs_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '5100', 'تكلفة أراضي مباعة', 'expenses', true, v_cogs_id, 'تكلفة شراء الأراضي المباعة'),
  (p_company_id, '5110', 'تكلفة البناء', 'expenses', true, v_cogs_id, 'تكلفة أعمال البناء للوحدات المباعة'),
  (p_company_id, '5120', 'تكلفة مواد البناء', 'expenses', false, v_cogs_id, 'تكلفة مواد البناء المستخدمة'),
  (p_company_id, '5130', 'تكلفة المقاولين', 'expenses', true, v_cogs_id, 'تكلفة أعمال المقاولين'),
  (p_company_id, '5140', 'تكلفة التصميم الهندسي', 'expenses', false, v_cogs_id, 'تكلفة التصاميم والاستشارات الهندسية'),
  (p_company_id, '5150', 'تكلفة التراخيص', 'expenses', false, v_cogs_id, 'تكلفة رخص البناء والتراخيص الحكومية'),
  (p_company_id, '5160', 'تكلفة الإشراف الهندسي', 'expenses', false, v_cogs_id, 'تكلفة الإشراف على المشاريع'),
  (p_company_id, '5170', 'تكلفة إيصال الخدمات', 'expenses', false, v_cogs_id, 'تكلفة إيصال كهرباء ومياه وصرف'),
  (p_company_id, '5180', 'تكلفة تمويل رأسمالية (IAS 23)', 'expenses', false, v_cogs_id, 'تكاليف اقتراض مرسملة على المشاريع حسب معيار IAS 23'),
  (p_company_id, '5190', 'تكلفة ضريبة التصرفات العقارية', 'expenses', false, v_cogs_id, 'ضريبة RETT 5% محملة على تكلفة الوحدات المباعة');

  -- ==================== 6000 المصروفات التشغيلية ====================
  INSERT INTO account_categories (company_id, code, name, type, is_system, description)
  VALUES (p_company_id, '6000', 'المصروفات التشغيلية', 'expenses', true, 'المصروفات التشغيلية والإدارية')
  RETURNING id INTO v_opex_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '6100', 'مصروفات إدارية', 'expenses', true, v_opex_id, 'مصروفات الإدارة العامة')
  RETURNING id INTO v_admin_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '6110', 'رواتب الموظفين', 'expenses', true, v_admin_exp_id, 'رواتب وأجور الموظفين الإداريين'),
  (p_company_id, '6111', 'بدلات سكن ونقل', 'expenses', false, v_admin_exp_id, 'بدلات سكن ونقل للموظفين'),
  (p_company_id, '6112', 'تأمين طبي', 'expenses', false, v_admin_exp_id, 'أقساط التأمين الطبي للموظفين'),
  (p_company_id, '6113', 'حصة الشركة في التأمينات', 'expenses', false, v_admin_exp_id, 'حصة الشركة في اشتراكات GOSI'),
  (p_company_id, '6120', 'إيجار المكتب', 'expenses', false, v_admin_exp_id, 'إيجار مكاتب الشركة'),
  (p_company_id, '6130', 'كهرباء ومياه', 'expenses', false, v_admin_exp_id, 'فواتير كهرباء وماء المكاتب'),
  (p_company_id, '6140', 'إنترنت واتصالات', 'expenses', false, v_admin_exp_id, 'فواتير اتصالات وإنترنت'),
  (p_company_id, '6150', 'قرطاسية', 'expenses', false, v_admin_exp_id, 'مستلزمات مكتبية وقرطاسية'),
  (p_company_id, '6155', 'رسوم حكومية وتراخيص', 'expenses', false, v_admin_exp_id, 'رسوم تراخيص تجارية وحكومية'),
  (p_company_id, '6160', 'استشارات قانونية', 'expenses', false, v_admin_exp_id, 'أتعاب محاماة واستشارات قانونية'),
  (p_company_id, '6170', 'محاسبة ومراجعة', 'expenses', false, v_admin_exp_id, 'أتعاب مراجعة حسابات واستشارات محاسبية'),
  (p_company_id, '6180', 'تدريب وتطوير موظفين', 'expenses', false, v_admin_exp_id, 'تدريب وتأهيل الموظفين');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '6200', 'مصروفات تسويق', 'expenses', false, v_opex_id, 'مصاريف التسويق والمبيعات')
  RETURNING id INTO v_marketing_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '6210', 'إعلانات عقارية', 'expenses', false, v_marketing_exp_id, 'إعلانات في منصات عقارية'),
  (p_company_id, '6220', 'عمولات بيع', 'expenses', true, v_marketing_exp_id, 'عمولات وسطاء ومسوقين عقاريين'),
  (p_company_id, '6230', 'تسويق إلكتروني', 'expenses', false, v_marketing_exp_id, 'حملات تسويق رقمي'),
  (p_company_id, '6240', 'معارض عقارية', 'expenses', false, v_marketing_exp_id, 'تكاليف المشاركة في معارض عقارية'),
  (p_company_id, '6250', 'عمولات وسطاء عقاريين', 'expenses', false, v_marketing_exp_id, 'عمولات وسطاء مرخصين');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '6300', 'مصروفات تشغيلية أخرى', 'expenses', false, v_opex_id, 'مصروفات تشغيلية متنوعة')
  RETURNING id INTO v_other_opex_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '6310', 'صيانة', 'expenses', false, v_other_opex_id, 'مصروفات صيانة عامة'),
  (p_company_id, '6320', 'نقل', 'expenses', false, v_other_opex_id, 'مصروفات نقل ومواصلات'),
  (p_company_id, '6330', 'تأمين', 'expenses', false, v_other_opex_id, 'أقساط تأمين'),
  (p_company_id, '6340', 'مصروف الإهلاك', 'expenses', false, v_other_opex_id, 'مصروف إهلاك الأصول الثابتة'),
  (p_company_id, '6350', 'مصروف مكافأة نهاية الخدمة', 'expenses', false, v_other_opex_id, 'مصروف مكافأة نهاية خدمة العام'),
  (p_company_id, '6355', 'سفر وإقامة', 'expenses', false, v_other_opex_id, 'مصروفات سفر وإقامة'),
  (p_company_id, '6360', 'ضيافة واستقبال', 'expenses', false, v_other_opex_id, 'مصروفات ضيافة واستقبال عملاء'),
  (p_company_id, '6370', 'اشتراكات مهنية', 'expenses', false, v_other_opex_id, 'رسوم اشتراكات مهنية ونقابية'),
  (p_company_id, '6380', 'مصروف الزكاة', 'expenses', true, v_other_opex_id, 'مصروف الزكاة السنوي');

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '6400', 'مصروفات مالية', 'expenses', false, v_opex_id, 'تكاليف التمويل والبنوك')
  RETURNING id INTO v_finance_exp_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '6410', 'فوائد القروض', 'expenses', false, v_finance_exp_id, 'فوائد وتكاليف تمويل بنكي'),
  (p_company_id, '6420', 'رسوم بنكية', 'expenses', false, v_finance_exp_id, 'رسوم وعمولات بنكية'),
  (p_company_id, '6430', 'غرامات وجزاءات ضريبية', 'expenses', false, v_finance_exp_id, 'غرامات تأخير وجزاءات من ZATCA'),
  (p_company_id, '6440', 'فروقات عملة', 'expenses', false, v_finance_exp_id, 'خسائر فروقات تحويل عملات');

  -- خسائر انخفاض قيمة
  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
  VALUES (p_company_id, '6500', 'خسائر انخفاض قيمة', 'expenses', false, v_opex_id, 'خسائر انخفاض قيمة الأصول')
  RETURNING id INTO v_impairment_id;

  INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description) VALUES
  (p_company_id, '6510', 'خسائر انخفاض قيمة أصول عقارية', 'expenses', false, v_impairment_id, 'انخفاض قيمة مخزون عقاري'),
  (p_company_id, '6520', 'خسائر انخفاض قيمة ذمم عملاء', 'expenses', false, v_impairment_id, 'ديون مشكوك في تحصيلها');
END;
$$;