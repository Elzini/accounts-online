-- Drop the overly permissive policy and recreate with proper restrictions
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Audit logs can only be inserted by triggers (SECURITY DEFINER functions)
-- No direct insert allowed from client
REVOKE INSERT ON public.audit_logs FROM authenticated;
REVOKE INSERT ON public.audit_logs FROM anon;

-- Grant insert only to the service role (used by SECURITY DEFINER functions)
GRANT INSERT ON public.audit_logs TO service_role;