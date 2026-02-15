-- Remove public access to fiscal_years_public view
-- This view was exposing ALL companies' fiscal year data to unauthenticated users

REVOKE SELECT ON public.fiscal_years_public FROM anon;
REVOKE SELECT ON public.fiscal_years_public FROM authenticated;
DROP VIEW IF EXISTS public.fiscal_years_public;