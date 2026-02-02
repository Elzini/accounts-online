
-- Step 1: Create helper functions first
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (ur.permission::text = _permission OR ur.permission::text = 'admin' OR ur.permission::text = 'super_admin')
  )
$$;

-- Step 2: Enable RLS on all tables
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies using a loop
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'cars', 'sales', 'customers', 'suppliers', 'expenses', 
    'journal_entries', 'fixed_assets', 'depreciation_entries',
    'bank_accounts', 'employees', 'vouchers', 'quotations',
    'account_categories', 'fiscal_years', 'backups'
  ])
  LOOP
    -- Drop all existing policies
    EXECUTE format('DROP POLICY IF EXISTS "Company isolation policy" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own company data" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own company data" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own company data" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own company data" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Company isolation select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Company isolation insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Company isolation update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Company isolation delete" ON public.%I', tbl);
    
    -- Create policies
    EXECUTE format('
      CREATE POLICY "Company isolation select" ON public.%I
      FOR SELECT TO authenticated
      USING (company_id = public.get_user_company_id())
    ', tbl);
    
    EXECUTE format('
      CREATE POLICY "Company isolation insert" ON public.%I
      FOR INSERT TO authenticated
      WITH CHECK (company_id = public.get_user_company_id())
    ', tbl);
    
    EXECUTE format('
      CREATE POLICY "Company isolation update" ON public.%I
      FOR UPDATE TO authenticated
      USING (company_id = public.get_user_company_id())
    ', tbl);
    
    EXECUTE format('
      CREATE POLICY "Company isolation delete" ON public.%I
      FOR DELETE TO authenticated
      USING (company_id = public.get_user_company_id())
    ', tbl);
  END LOOP;
END $$;

-- Step 4: Special policies for audit_logs
DROP POLICY IF EXISTS "Company isolation select" ON public.audit_logs;
DROP POLICY IF EXISTS "Company isolation insert" ON public.audit_logs;
DROP POLICY IF EXISTS "Company isolation update" ON public.audit_logs;
DROP POLICY IF EXISTS "Company isolation delete" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id() AND public.has_permission('admin'));

-- Step 5: Journal entry lines via parent
DROP POLICY IF EXISTS "Journal lines via parent" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Company isolation select" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Company isolation insert" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Company isolation update" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Company isolation delete" ON public.journal_entry_lines;
CREATE POLICY "Journal lines via parent" ON public.journal_entry_lines
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.company_id = public.get_user_company_id()));

-- Step 6: Companies policies
DROP POLICY IF EXISTS "Super admin access all" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Super admin can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Company isolation select" ON public.companies;

CREATE POLICY "Users can view own company" ON public.companies
FOR SELECT TO authenticated
USING (public.has_permission('super_admin') OR id = public.get_user_company_id());

CREATE POLICY "Super admin can manage companies" ON public.companies
FOR ALL TO authenticated
USING (public.has_permission('super_admin'))
WITH CHECK (public.has_permission('super_admin'));
