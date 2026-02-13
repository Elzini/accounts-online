
-- Fix employees table: Remove overly permissive policies that bypass admin-only restriction
-- The "Users can ..." and "strict_isolation" policies allow ANY company user full access,
-- negating the admin-only policies (PostgreSQL ORs permissive policies together)

-- Remove permissive non-admin policies
DROP POLICY IF EXISTS "Users can view own company employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert own company employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update own company employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete own company employees" ON public.employees;
DROP POLICY IF EXISTS "strict_isolation" ON public.employees;

-- Remove duplicate admin policies (keep one set)
DROP POLICY IF EXISTS "Only admins can view employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can delete employees" ON public.employees;

-- Verify remaining: only "Admin only - view/insert/update/delete employees" policies stay
-- These properly enforce: company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
