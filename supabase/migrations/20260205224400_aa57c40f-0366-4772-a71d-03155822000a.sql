-- Fix the SECURITY DEFINER issue by using SECURITY INVOKER explicitly
DROP VIEW IF EXISTS public.customers_safe;

CREATE VIEW public.customers_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  company_id,
  name,
  -- Mask phone: show only last 4 digits
  CASE 
    WHEN has_permission('admin'::text) OR is_super_admin(auth.uid()) THEN phone
    ELSE CONCAT('****', RIGHT(phone, 4))
  END AS phone,
  -- Mask address: show only city/area
  CASE 
    WHEN has_permission('admin'::text) OR is_super_admin(auth.uid()) THEN address
    ELSE COALESCE(SPLIT_PART(address, ',', 1), '***')
  END AS address,
  -- Mask ID number: show only last 4 digits
  CASE 
    WHEN has_permission('admin'::text) OR is_super_admin(auth.uid()) THEN id_number
    ELSE CONCAT('****', RIGHT(COALESCE(id_number, ''), 4))
  END AS id_number,
  registration_number,
  created_at,
  updated_at
FROM public.customers
WHERE 
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    has_permission('sales'::text) 
    OR has_permission('admin'::text) 
    OR is_super_admin(auth.uid())
  );