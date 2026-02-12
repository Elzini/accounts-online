
-- Fix permissive INSERT policy on security_audit_trail
DROP POLICY IF EXISTS "System can insert audit trail" ON public.security_audit_trail;

CREATE POLICY "System can insert audit trail"
  ON public.security_audit_trail FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    OR current_user = 'postgres'
    OR current_user LIKE 'supabase%'
  );
