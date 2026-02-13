
-- Fix bank_accounts: Remove overly permissive strict_isolation policy that bypasses admin-only restriction
-- PostgreSQL ORs permissive policies, so strict_isolation (company check only) negates admin requirements

DROP POLICY IF EXISTS "strict_isolation" ON public.bank_accounts;

-- bank_accounts_strict_isolation already requires admin, keep it
-- Bank accounts secure select/insert/update/delete already require admin, keep them
