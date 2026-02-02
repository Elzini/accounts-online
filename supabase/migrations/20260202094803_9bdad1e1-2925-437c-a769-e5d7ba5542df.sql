-- Fix RBAC permission type mismatch that breaks PostgREST queries
CREATE OR REPLACE FUNCTION public.rbac_check(required_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_perm BOOLEAN := FALSE;
  required_perm public.user_permission;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Super admin bypass
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND permission = 'super_admin'::public.user_permission
  ) INTO has_perm;

  IF has_perm THEN
    RETURN TRUE;
  END IF;

  -- Safely cast required permission
  BEGIN
    required_perm := required_permission::public.user_permission;
  EXCEPTION
    WHEN invalid_text_representation OR invalid_parameter_value THEN
      RETURN FALSE;
  END;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND permission = required_perm
  ) INTO has_perm;

  RETURN has_perm;
END;
$$;