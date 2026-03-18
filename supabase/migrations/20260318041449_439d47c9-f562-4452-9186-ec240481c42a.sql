CREATE OR REPLACE FUNCTION public.verify_user_company_access(_user_id uuid, _company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND permission = 'super_admin'
  );
$function$;