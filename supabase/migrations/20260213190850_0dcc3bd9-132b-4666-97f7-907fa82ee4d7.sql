
CREATE OR REPLACE FUNCTION public.check_tenant_encryption_exists(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_encryption_keys
    WHERE company_id = p_company_id AND is_active = true
  );
END;
$$;
