-- Function to check if tenant schema exists
CREATE OR REPLACE FUNCTION public.check_tenant_schema_exists(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name text;
BEGIN
  schema_name := 'tenant_' || replace(p_company_id::text, '-', '_');
  RETURN EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = schema_name
  );
END;
$$;

-- Ensure subdomain has unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_companies_subdomain_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_companies_subdomain_unique ON public.companies (subdomain) WHERE subdomain IS NOT NULL;
  END IF;
END;
$$;
