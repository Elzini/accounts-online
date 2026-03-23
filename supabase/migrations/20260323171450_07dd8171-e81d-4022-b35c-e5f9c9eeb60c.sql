
-- Disable RLS, then re-enable to force clean state
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;

-- Now drop all policies one by one using a DO block with no EXIT
DO $$
DECLARE
  pol_name TEXT;
BEGIN
  LOOP
    SELECT policyname INTO pol_name 
    FROM pg_policies 
    WHERE tablename = 'suppliers' AND schemaname = 'public'
    LIMIT 1;
    
    EXIT WHEN pol_name IS NULL;
    
    EXECUTE format('DROP POLICY %I ON public.suppliers', pol_name);
  END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create clean policies
CREATE POLICY "supplier_select"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (strict_company_check(company_id) AND (rbac_check('purchases') OR rbac_check('admin') OR rbac_check('sales')));

CREATE POLICY "supplier_insert"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (strict_company_check(company_id) AND rbac_check('purchases'));

CREATE POLICY "supplier_update"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (strict_company_check(company_id) AND rbac_check('purchases'))
  WITH CHECK (strict_company_check(company_id) AND rbac_check('purchases'));

CREATE POLICY "supplier_delete"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (strict_company_check(company_id) AND rbac_check('purchases'));

CREATE POLICY "super_admin_suppliers"
  ON public.suppliers FOR ALL
  TO authenticated
  USING (rbac_check('super_admin'));
