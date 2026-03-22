
-- CRITICAL SECURITY FIX: Remove all vulnerable tenant_isolation_policy entries
-- These policies use current_setting('app.current_tenant') on the PUBLIC role,
-- allowing any anonymous user to access company data by setting a session variable.

DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.expenses;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.suppliers;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.vouchers;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.checks;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.sales;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.cars;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.customers;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.account_categories;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.journal_entries;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.journal_entry_lines;
