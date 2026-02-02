-- إضافة حسابات الأصول الثابتة ومجمع الإهلاك للشركات التي لا تملكها

-- 1300 - الأصول الثابتة (حساب رئيسي)
INSERT INTO account_categories (company_id, code, name, type, is_system, description)
SELECT c.id, '1300', 'الأصول الثابتة', 'assets', true, 'حساب رئيسي للأصول الثابتة'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM account_categories ac WHERE ac.company_id = c.id AND ac.code = '1300'
);

-- 1310 - السيارات
INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
SELECT c.id, '1310', 'السيارات', 'assets', true, 
  (SELECT id FROM account_categories WHERE company_id = c.id AND code = '1300' LIMIT 1),
  'سيارات الشركة والمركبات'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM account_categories ac WHERE ac.company_id = c.id AND ac.code = '1310'
);

-- 1320 - المعدات والآلات
INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
SELECT c.id, '1320', 'المعدات والآلات', 'assets', true,
  (SELECT id FROM account_categories WHERE company_id = c.id AND code = '1300' LIMIT 1),
  'معدات وآلات الشركة'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM account_categories ac WHERE ac.company_id = c.id AND ac.code = '1320'
);

-- 1330 - الأثاث المكتبي
INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
SELECT c.id, '1330', 'الأثاث المكتبي', 'assets', true,
  (SELECT id FROM account_categories WHERE company_id = c.id AND code = '1300' LIMIT 1),
  'أثاث ومفروشات المكاتب'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM account_categories ac WHERE ac.company_id = c.id AND ac.code = '1330'
);

-- 1340 - أجهزة الكمبيوتر
INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
SELECT c.id, '1340', 'أجهزة الكمبيوتر', 'assets', true,
  (SELECT id FROM account_categories WHERE company_id = c.id AND code = '1300' LIMIT 1),
  'أجهزة حاسب آلي ومعدات تقنية'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM account_categories ac WHERE ac.company_id = c.id AND ac.code = '1340'
);

-- 1350 - الأصول غير الملموسة
INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
SELECT c.id, '1350', 'الأصول غير الملموسة', 'assets', true,
  (SELECT id FROM account_categories WHERE company_id = c.id AND code = '1300' LIMIT 1),
  'برامج محاسبية، تراخيص، علامات تجارية'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM account_categories ac WHERE ac.company_id = c.id AND ac.code = '1350'
);

-- 1390 - مجمع إهلاك الأصول الثابتة (حساب مقابل - Contra Asset)
INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
SELECT c.id, '1390', 'مجمع إهلاك الأصول الثابتة', 'assets', true,
  (SELECT id FROM account_categories WHERE company_id = c.id AND code = '1300' LIMIT 1),
  'حساب مجمع الإهلاك المتراكم للأصول الثابتة (حساب مقابل)'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM account_categories ac WHERE ac.company_id = c.id AND ac.code = '1390'
);

-- التأكد من وجود حساب مصروف الإهلاك 5401
INSERT INTO account_categories (company_id, code, name, type, is_system, description)
SELECT c.id, '5401', 'مصروفات الإهلاك', 'expenses', true, 'مصروف الإهلاك الدوري للأصول الثابتة'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM account_categories ac WHERE ac.company_id = c.id AND ac.code = '5401'
);

-- تحديث قوالب دليل الحسابات لتشمل جميع أنواع الشركات
INSERT INTO coa_templates (code, name, name_en, type, company_type, parent_code, is_header, sort_order)
SELECT '1310', 'السيارات', 'Vehicles', 'asset', ct.company_type, '1300', false, 1310
FROM (SELECT DISTINCT company_type FROM coa_templates) ct
WHERE NOT EXISTS (
  SELECT 1 FROM coa_templates t WHERE t.code = '1310' AND t.company_type = ct.company_type
);

INSERT INTO coa_templates (code, name, name_en, type, company_type, parent_code, is_header, sort_order)
SELECT '1320', 'المعدات والآلات', 'Equipment & Machinery', 'asset', ct.company_type, '1300', false, 1320
FROM (SELECT DISTINCT company_type FROM coa_templates) ct
WHERE NOT EXISTS (
  SELECT 1 FROM coa_templates t WHERE t.code = '1320' AND t.company_type = ct.company_type
);

INSERT INTO coa_templates (code, name, name_en, type, company_type, parent_code, is_header, sort_order)
SELECT '1330', 'الأثاث المكتبي', 'Office Furniture', 'asset', ct.company_type, '1300', false, 1330
FROM (SELECT DISTINCT company_type FROM coa_templates) ct
WHERE NOT EXISTS (
  SELECT 1 FROM coa_templates t WHERE t.code = '1330' AND t.company_type = ct.company_type
);

INSERT INTO coa_templates (code, name, name_en, type, company_type, parent_code, is_header, sort_order)
SELECT '1340', 'أجهزة الكمبيوتر', 'Computers & IT Equipment', 'asset', ct.company_type, '1300', false, 1340
FROM (SELECT DISTINCT company_type FROM coa_templates) ct
WHERE NOT EXISTS (
  SELECT 1 FROM coa_templates t WHERE t.code = '1340' AND t.company_type = ct.company_type
);

INSERT INTO coa_templates (code, name, name_en, type, company_type, parent_code, is_header, sort_order)
SELECT '1350', 'الأصول غير الملموسة', 'Intangible Assets', 'asset', ct.company_type, '1300', false, 1350
FROM (SELECT DISTINCT company_type FROM coa_templates) ct
WHERE NOT EXISTS (
  SELECT 1 FROM coa_templates t WHERE t.code = '1350' AND t.company_type = ct.company_type
);