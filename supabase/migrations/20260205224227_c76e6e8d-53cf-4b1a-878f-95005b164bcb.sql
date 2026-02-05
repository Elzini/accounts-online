-- Drop all existing policies on cars table to clean up conflicts
DROP POLICY IF EXISTS "Authenticated users can delete company cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can insert company cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can update company cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can view company cars" ON public.cars;
DROP POLICY IF EXISTS "Company isolation delete" ON public.cars;
DROP POLICY IF EXISTS "Company isolation insert" ON public.cars;
DROP POLICY IF EXISTS "Company isolation select" ON public.cars;
DROP POLICY IF EXISTS "Company isolation update" ON public.cars;
DROP POLICY IF EXISTS "Delete cars in company" ON public.cars;
DROP POLICY IF EXISTS "Insert cars in company" ON public.cars;
DROP POLICY IF EXISTS "Update cars in company" ON public.cars;
DROP POLICY IF EXISTS "View cars in company" ON public.cars;
DROP POLICY IF EXISTS "cars_strict_isolation" ON public.cars;

-- Create strict RLS policies with RBAC

-- SELECT: Only users with purchases, sales, or admin permission can view cars
CREATE POLICY "cars_select_authorized" 
ON public.cars 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    has_permission('purchases'::text) 
    OR has_permission('sales'::text) 
    OR has_permission('admin'::text) 
    OR is_super_admin(auth.uid())
  )
);

-- INSERT: Only users with purchases or admin permission can add cars
CREATE POLICY "cars_insert_authorized" 
ON public.cars 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    has_permission('purchases'::text) 
    OR has_permission('admin'::text) 
    OR is_super_admin(auth.uid())
  )
);

-- UPDATE: Only users with purchases, sales, or admin permission can update cars
CREATE POLICY "cars_update_authorized" 
ON public.cars 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    has_permission('purchases'::text) 
    OR has_permission('sales'::text) 
    OR has_permission('admin'::text) 
    OR is_super_admin(auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
);

-- DELETE: Only admin or super_admin can delete cars
CREATE POLICY "cars_delete_authorized" 
ON public.cars 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    has_permission('admin'::text) 
    OR is_super_admin(auth.uid())
  )
);