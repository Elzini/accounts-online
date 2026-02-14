
-- CUSTOMERS TABLE: Remove overly permissive "Company isolation" policies that lack role checks
-- These allow ANY authenticated user in the company to access customer data without permission checks
DROP POLICY IF EXISTS "Company isolation select" ON public.customers;
DROP POLICY IF EXISTS "Company isolation insert" ON public.customers;
DROP POLICY IF EXISTS "Company isolation update" ON public.customers;
DROP POLICY IF EXISTS "Company isolation delete" ON public.customers;

-- Also remove older duplicate policies that overlap with the stricter ones
DROP POLICY IF EXISTS "View customers in company" ON public.customers;
DROP POLICY IF EXISTS "Insert customers in company" ON public.customers;
DROP POLICY IF EXISTS "Update customers in company" ON public.customers;
DROP POLICY IF EXISTS "Delete customers in company" ON public.customers;

-- BANK ACCOUNTS TABLE: Remove duplicate permissive policy
-- The "Bank accounts secure *" policies already enforce admin-only + company isolation
DROP POLICY IF EXISTS "bank_accounts_strict_isolation" ON public.bank_accounts;
