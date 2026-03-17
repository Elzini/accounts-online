
-- Fix audit_logs: convert denial policies to RESTRICTIVE so they cannot be overridden

-- Drop the permissive strict_isolation ALL policy that overrides denials
DROP POLICY IF EXISTS "strict_isolation" ON audit_logs;

-- Drop existing permissive denial policies
DROP POLICY IF EXISTS "audit_logs_no_direct_insert" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_update" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON audit_logs;

-- Recreate denial policies as RESTRICTIVE (ANDed, cannot be overridden)
CREATE POLICY "audit_logs_no_direct_insert" ON audit_logs
AS RESTRICTIVE FOR INSERT TO public
WITH CHECK (false);

CREATE POLICY "audit_logs_no_update" ON audit_logs
AS RESTRICTIVE FOR UPDATE TO public
USING (false);

CREATE POLICY "audit_logs_no_delete" ON audit_logs
AS RESTRICTIVE FOR DELETE TO public
USING (false);

-- Allow SELECT for company members only (PERMISSIVE is fine for reads)
CREATE POLICY "audit_logs_select_company" ON audit_logs
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.strict_company_check(company_id));
