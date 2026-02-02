-- =====================================================
-- تعزيز أمان النظام - تحديث سياسات الجداول المتبقية
-- =====================================================

-- سياسات audit_logs
DROP POLICY IF EXISTS "Admins can view company audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Secure audit select"
ON public.audit_logs FOR SELECT
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Secure audit insert"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- سياسات profiles
DROP POLICY IF EXISTS "Secure company profiles select" ON public.profiles;
DROP POLICY IF EXISTS "Secure own profile update" ON public.profiles;

CREATE POLICY "Profiles company select"
ON public.profiles FOR SELECT
USING (
  user_id = auth.uid()
  OR public.can_access_company_data(company_id)
);

CREATE POLICY "Profiles own update"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid());

-- سياسات employees
DROP POLICY IF EXISTS "Secure employees admin select" ON public.employees;
DROP POLICY IF EXISTS "Secure employees admin insert" ON public.employees;
DROP POLICY IF EXISTS "Secure employees admin update" ON public.employees;
DROP POLICY IF EXISTS "Secure employees admin delete" ON public.employees;

CREATE POLICY "Employees secure select"
ON public.employees FOR SELECT
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Employees secure insert"
ON public.employees FOR INSERT
WITH CHECK (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Employees secure update"
ON public.employees FOR UPDATE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Employees secure delete"
ON public.employees FOR DELETE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

-- سياسات bank_accounts
DROP POLICY IF EXISTS "Secure bank admin select" ON public.bank_accounts;
DROP POLICY IF EXISTS "Secure bank admin insert" ON public.bank_accounts;
DROP POLICY IF EXISTS "Secure bank admin update" ON public.bank_accounts;
DROP POLICY IF EXISTS "Secure bank admin delete" ON public.bank_accounts;

CREATE POLICY "Bank accounts secure select"
ON public.bank_accounts FOR SELECT
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Bank accounts secure insert"
ON public.bank_accounts FOR INSERT
WITH CHECK (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Bank accounts secure update"
ON public.bank_accounts FOR UPDATE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Bank accounts secure delete"
ON public.bank_accounts FOR DELETE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

-- سياسات tax_settings
DROP POLICY IF EXISTS "Secure tax admin select" ON public.tax_settings;
DROP POLICY IF EXISTS "Secure tax admin insert" ON public.tax_settings;
DROP POLICY IF EXISTS "Secure tax admin update" ON public.tax_settings;

CREATE POLICY "Tax settings secure select"
ON public.tax_settings FOR SELECT
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Tax settings secure insert"
ON public.tax_settings FOR INSERT
WITH CHECK (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Tax settings secure update"
ON public.tax_settings FOR UPDATE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

-- سياسات financing_companies
DROP POLICY IF EXISTS "Secure financing admin select" ON public.financing_companies;
DROP POLICY IF EXISTS "Secure financing admin insert" ON public.financing_companies;
DROP POLICY IF EXISTS "Secure financing admin update" ON public.financing_companies;
DROP POLICY IF EXISTS "Secure financing admin delete" ON public.financing_companies;

CREATE POLICY "Financing secure select"
ON public.financing_companies FOR SELECT
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Financing secure insert"
ON public.financing_companies FOR INSERT
WITH CHECK (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Financing secure update"
ON public.financing_companies FOR UPDATE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Financing secure delete"
ON public.financing_companies FOR DELETE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

-- سياسات payroll_records
DROP POLICY IF EXISTS "Secure payroll admin select" ON public.payroll_records;
DROP POLICY IF EXISTS "Secure payroll admin insert" ON public.payroll_records;
DROP POLICY IF EXISTS "Secure payroll admin update" ON public.payroll_records;
DROP POLICY IF EXISTS "Secure payroll admin delete" ON public.payroll_records;

CREATE POLICY "Payroll secure select"
ON public.payroll_records FOR SELECT
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Payroll secure insert"
ON public.payroll_records FOR INSERT
WITH CHECK (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Payroll secure update"
ON public.payroll_records FOR UPDATE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);

CREATE POLICY "Payroll secure delete"
ON public.payroll_records FOR DELETE
USING (
  public.can_access_company_data(company_id)
  AND public.secure_has_permission('admin')
);