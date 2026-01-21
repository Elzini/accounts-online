-- Fix 1: Restrict tax_settings to admin users only
DROP POLICY IF EXISTS "View tax settings in company" ON public.tax_settings;

CREATE POLICY "View tax settings in company - admin only" ON public.tax_settings
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
  );

-- Fix 2: Restrict profiles table - users should only see their own profile or profiles in same company (admin only for others)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in same company" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view profiles in same company" ON public.profiles
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
  );

-- Fix 3: Verify customers table RLS - ensure only same company users can view
-- Check and strengthen customers RLS policies
DROP POLICY IF EXISTS "Users can view customers in same company" ON public.customers;

CREATE POLICY "Users can view customers in same company" ON public.customers
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    company_id = get_user_company_id(auth.uid())
  );

-- Fix 4: Verify sales table RLS - ensure only same company users can view
DROP POLICY IF EXISTS "Users can view sales in same company" ON public.sales;

CREATE POLICY "Users can view sales in same company" ON public.sales
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    company_id = get_user_company_id(auth.uid())
  );