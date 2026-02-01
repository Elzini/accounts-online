
-- ============================================
-- تكملة تحديث صلاحيات الأمان للشركات الجديدة
-- Continue updating security permissions
-- ============================================

-- تحديث سياسات INSERT المتبقية مع DROP IF EXISTS أولاً

-- 15. سندات - تحديث السياسة الموجودة
DROP POLICY IF EXISTS "Insert vouchers in company" ON public.vouchers;
CREATE POLICY "Insert vouchers in company" ON public.vouchers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    (has_permission(auth.uid(), 'sales'::user_permission) OR has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  );

-- 16. معارض شريكة
DROP POLICY IF EXISTS "Insert partner dealerships in company" ON public.partner_dealerships;
CREATE POLICY "Insert partner dealerships in company" ON public.partner_dealerships
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    (has_permission(auth.uid(), 'sales'::user_permission) OR has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  );

-- 17. مصروفات مدفوعة مقدماً
DROP POLICY IF EXISTS "Insert prepaid expenses in company" ON public.prepaid_expenses;
CREATE POLICY "Insert prepaid expenses in company" ON public.prepaid_expenses
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  );

-- 18. بيانات الفواتير المستوردة
DROP POLICY IF EXISTS "Insert imported invoice data" ON public.imported_invoice_data;
CREATE POLICY "Insert imported invoice data" ON public.imported_invoice_data
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 19. مبيعات التقسيط
DROP POLICY IF EXISTS "Insert installment sales in company" ON public.installment_sales;
CREATE POLICY "Insert installment sales in company" ON public.installment_sales
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid()))
  );

-- 20. إعدادات الضريبة
DROP POLICY IF EXISTS "Insert tax settings in company" ON public.tax_settings;
CREATE POLICY "Insert tax settings in company" ON public.tax_settings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 21. قواعد القيود
DROP POLICY IF EXISTS "Insert journal entry rules in company" ON public.journal_entry_rules;
CREATE POLICY "Insert journal entry rules in company" ON public.journal_entry_rules
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 22. إعدادات القوائم
DROP POLICY IF EXISTS "Insert menu configuration in company" ON public.menu_configuration;
CREATE POLICY "Insert menu configuration in company" ON public.menu_configuration
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 23. السنوات المالية
DROP POLICY IF EXISTS "Insert fiscal years in company" ON public.fiscal_years;
CREATE POLICY "Insert fiscal years in company" ON public.fiscal_years
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 24. فئات المصروفات
DROP POLICY IF EXISTS "Insert expense categories in company" ON public.expense_categories;
CREATE POLICY "Insert expense categories in company" ON public.expense_categories
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 25. شركات التمويل
DROP POLICY IF EXISTS "Insert financing companies in company" ON public.financing_companies;
CREATE POLICY "Insert financing companies in company" ON public.financing_companies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 26. حسابات البنوك
DROP POLICY IF EXISTS "Insert bank accounts in company" ON public.bank_accounts;
CREATE POLICY "Insert bank accounts in company" ON public.bank_accounts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 27. تسويات البنوك
DROP POLICY IF EXISTS "Insert bank reconciliations in company" ON public.bank_reconciliations;
CREATE POLICY "Insert bank reconciliations in company" ON public.bank_reconciliations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 28. كشوف البنوك
DROP POLICY IF EXISTS "Insert bank statements in company" ON public.bank_statements;
CREATE POLICY "Insert bank statements in company" ON public.bank_statements
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 29. التقارير المخصصة
DROP POLICY IF EXISTS "Insert custom reports in company" ON public.custom_reports;
CREATE POLICY "Insert custom reports in company" ON public.custom_reports
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 30. إعدادات لوحة التحكم
DROP POLICY IF EXISTS "Insert dashboard config in company" ON public.dashboard_config;
CREATE POLICY "Insert dashboard config in company" ON public.dashboard_config
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 31. إعدادات القوائم المالية
DROP POLICY IF EXISTS "Insert financial statement config" ON public.financial_statement_config;
CREATE POLICY "Insert financial statement config in company" ON public.financial_statement_config
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 32. دفعات شراء
DROP POLICY IF EXISTS "Insert purchase batches in company" ON public.purchase_batches;
CREATE POLICY "Insert purchase batches in company" ON public.purchase_batches
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  );

-- 33. إعدادات التطبيق - تحديث لتشديد الأمان
DROP POLICY IF EXISTS "Insert app settings for company" ON public.app_settings;
CREATE POLICY "Insert app settings for company" ON public.app_settings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      (company_id IS NULL AND is_super_admin(auth.uid())) OR
      (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
    )
  );

-- 34. استيراد ميزان المراجعة
DROP POLICY IF EXISTS "Insert trial balance imports in company" ON public.trial_balance_imports;
CREATE POLICY "Insert trial balance imports in company" ON public.trial_balance_imports
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 35. ربط الحسابات
DROP POLICY IF EXISTS "Insert account mappings in company" ON public.account_mappings;
CREATE POLICY "Insert account mappings in company" ON public.account_mappings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );

-- 36. فئات الحسابات
DROP POLICY IF EXISTS "Insert account categories in company" ON public.account_categories;
CREATE POLICY "Insert account categories in company" ON public.account_categories
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id = get_user_company_id(auth.uid()) AND
    is_admin(auth.uid())
  );
