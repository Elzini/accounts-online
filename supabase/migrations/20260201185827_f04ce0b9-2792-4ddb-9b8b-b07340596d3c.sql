
-- ============================================
-- FIX SECURITY: Restrict access to customers table
-- ============================================

-- Drop the overly permissive policy that allows any company user to view all customers
DROP POLICY IF EXISTS "Users can view customers in same company" ON public.customers;

-- Keep the existing "View customers in company" policy which already requires sales or admin permission
-- It already has: (is_super_admin(auth.uid()) OR ((company_id = get_user_company_id(auth.uid())) AND (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid()))))

-- ============================================
-- FIX SECURITY: Restrict access to sales table  
-- ============================================

-- Drop the overly permissive policy that allows any company user to view all sales
DROP POLICY IF EXISTS "Users can view sales in same company" ON public.sales;

-- Keep the existing "View sales in company" policy which already requires sales, reports or admin permission
-- It already has: (is_super_admin(auth.uid()) OR ((company_id = get_user_company_id(auth.uid())) AND (has_permission(auth.uid(), 'sales'::user_permission) OR has_permission(auth.uid(), 'reports'::user_permission) OR is_admin(auth.uid()))))

-- ============================================
-- FIX SECURITY: Restrict access to suppliers table
-- ============================================

-- Also fix suppliers table which may have similar issue
DROP POLICY IF EXISTS "Users can view suppliers in same company" ON public.suppliers;

-- Ensure the proper restricted policy exists for suppliers
DROP POLICY IF EXISTS "View suppliers in company" ON public.suppliers;
CREATE POLICY "View suppliers in company" ON public.suppliers
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR (
      company_id = get_user_company_id(auth.uid()) AND (
        has_permission(auth.uid(), 'purchases'::user_permission) OR 
        is_admin(auth.uid())
      )
    )
  );

-- ============================================
-- Ensure cars table is also properly restricted
-- ============================================
DROP POLICY IF EXISTS "Users can view cars in same company" ON public.cars;

-- ============================================
-- Ensure expenses table is properly restricted
-- ============================================
DROP POLICY IF EXISTS "Users can view expenses in same company" ON public.expenses;

-- ============================================
-- Restrict journal entries - sensitive financial data
-- ============================================
DROP POLICY IF EXISTS "Users can view journal entries in same company" ON public.journal_entries;
