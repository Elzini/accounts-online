
-- Force drop ALL policies on suppliers table and recreate clean ones
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'suppliers' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.suppliers', pol.policyname);
  END LOOP;
END $$;

-- Recreate clean policies
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
