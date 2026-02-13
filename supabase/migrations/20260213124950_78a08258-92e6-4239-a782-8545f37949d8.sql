
-- Remove the overly permissive select policy that allows any company user to read expenses
DROP POLICY IF EXISTS "Company isolation select" ON public.expenses;

-- Remove the old permissive insert/update/delete policies that lack permission checks
DROP POLICY IF EXISTS "Company isolation insert" ON public.expenses;
DROP POLICY IF EXISTS "Company isolation update" ON public.expenses;
DROP POLICY IF EXISTS "Company isolation delete" ON public.expenses;

-- The remaining policies are properly restrictive:
-- "View expenses in company" requires reports/admin + company isolation
-- "Insert expenses in company" requires purchases/admin
-- "Update expenses in company" requires purchases/admin  
-- "Delete expenses in company" requires admin
-- "expenses_strict_isolation" enforces strict_company_check
-- tenant_isolation_policy handles tenant-level isolation
