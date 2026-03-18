
-- Remove the overly permissive audit_logs_select_company policy
-- This policy allows any authenticated company member to read all audit logs
-- including sensitive HR/payroll/financial data snapshots
DROP POLICY IF EXISTS "audit_logs_select_company" ON public.audit_logs;
