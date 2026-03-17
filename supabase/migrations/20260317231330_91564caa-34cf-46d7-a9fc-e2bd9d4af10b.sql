
-- Drop all vulnerable tenant_policy_* policies that use current_setting('app.current_tenant')
-- and replace with auth.uid()-based policies via profiles table

DO $$
DECLARE
  pol RECORD;
  company_uuid TEXT;
BEGIN
  -- Find and replace all tenant_policy_* policies using current_setting
  FOR pol IN
    SELECT DISTINCT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname LIKE 'tenant_policy_%'
    AND qual::text LIKE '%current_setting%'
  LOOP
    -- Extract company UUID from schema name
    company_uuid := replace(replace(pol.schemaname, 'tenant_', ''), '_', '-');

    -- Drop the vulnerable policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);

    -- Recreate with auth.uid()-based check
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR ALL TO authenticated
       USING (
         EXISTS (
           SELECT 1 FROM public.profiles
           WHERE profiles.user_id = auth.uid()
           AND profiles.company_id = %L::uuid
         )
         OR EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_roles.user_id = auth.uid()
           AND user_roles.permission = ''super_admin''
         )
       )
       WITH CHECK (
         EXISTS (
           SELECT 1 FROM public.profiles
           WHERE profiles.user_id = auth.uid()
           AND profiles.company_id = %L::uuid
         )
         OR EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_roles.user_id = auth.uid()
           AND user_roles.permission = ''super_admin''
         )
       )',
      pol.policyname, pol.schemaname, pol.tablename, company_uuid, company_uuid
    );
  END LOOP;
END $$;
