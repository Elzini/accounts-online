
-- Use pg_catalog directly to drop by OID trick
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT p.polname 
    FROM pg_catalog.pg_policy p 
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid 
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'suppliers' AND n.nspname = 'public'
    AND p.polname IN ('tenant_isolation_policy', 'tenant_policy_suppliers')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.suppliers', r.polname);
  END LOOP;
END $$;
