
-- Remove all vulnerable tenant_isolation_policy policies that use current_setting('app.current_tenant')
-- and replace with auth.uid()-based policies tied to the user's company membership

DO $$
DECLARE
  schema_rec RECORD;
  table_rec RECORD;
  company_uuid TEXT;
BEGIN
  -- Loop through all tenant schemas
  FOR schema_rec IN
    SELECT DISTINCT schemaname 
    FROM pg_policies 
    WHERE policyname = 'tenant_isolation_policy'
    AND schemaname LIKE 'tenant_%'
  LOOP
    -- Extract company UUID from schema name (replace underscores back to hyphens)
    company_uuid := replace(replace(schema_rec.schemaname, 'tenant_', ''), '_', '-');
    
    -- Loop through all tables in this schema that have the vulnerable policy
    FOR table_rec IN
      SELECT DISTINCT tablename 
      FROM pg_policies 
      WHERE schemaname = schema_rec.schemaname 
      AND policyname = 'tenant_isolation_policy'
    LOOP
      -- Drop the vulnerable policy
      EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON %I.%I', 
        schema_rec.schemaname, table_rec.tablename);
      
      -- Create new secure policy using auth.uid() via profiles table
      EXECUTE format(
        'CREATE POLICY "tenant_isolation_policy" ON %I.%I FOR ALL TO authenticated
         USING (
           EXISTS (
             SELECT 1 FROM public.profiles
             WHERE profiles.user_id = auth.uid()
             AND profiles.company_id = %L::uuid
           )
           OR
           EXISTS (
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
           OR
           EXISTS (
             SELECT 1 FROM public.user_roles
             WHERE user_roles.user_id = auth.uid()
             AND user_roles.permission = ''super_admin''
           )
         )',
        schema_rec.schemaname, table_rec.tablename, company_uuid, company_uuid
      );
    END LOOP;
  END LOOP;
END $$;
