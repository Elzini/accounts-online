
-- Fix check_tenant_schema_exists to match the actual naming convention: tenant_{uuid_with_underscores}
CREATE OR REPLACE FUNCTION public.check_tenant_schema_exists(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema_name text;
BEGIN
  v_schema_name := 'tenant_' || replace(p_company_id::text, '-', '_');
  RETURN EXISTS (
    SELECT 1 FROM information_schema.schemata s WHERE s.schema_name = v_schema_name
  );
END;
$$;
