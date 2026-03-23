
-- Drop ALL legacy hardcoded tenant policies on suppliers
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.suppliers;
DROP POLICY IF EXISTS "tenant_policy_suppliers" ON public.suppliers;

-- Drop redundant/overlapping policies  
DROP POLICY IF EXISTS "Admins can view full supplier data" ON public.suppliers;
DROP POLICY IF EXISTS "Delete suppliers in company" ON public.suppliers;

-- Now create clean unified policies (keep existing RBAC ones, add a generic SELECT for authenticated)
-- The existing policies are:
-- "Purchase users can insert suppliers" (INSERT) ✓
-- "Purchase users can update suppliers" (UPDATE) ✓  
-- "Purchase users can delete suppliers" (DELETE) ✓
-- "Purchases users can view suppliers" (SELECT) - but targets only role {16481}, need to check
-- "Super admins full supplier access" (ALL) ✓

-- Recreate the SELECT policy to be cleaner (drop old one first)
DROP POLICY IF EXISTS "Purchases users can view suppliers" ON public.suppliers;

CREATE POLICY "Users can view own company suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (
    strict_company_check(company_id) 
    AND (rbac_check('purchases') OR rbac_check('admin') OR rbac_check('sales'))
  );
