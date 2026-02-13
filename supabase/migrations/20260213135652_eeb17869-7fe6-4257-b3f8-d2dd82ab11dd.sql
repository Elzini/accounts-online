
-- Recreate customers_safe view with registration_number masking
DROP VIEW IF EXISTS public.customers_safe;

CREATE VIEW public.customers_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  company_id,
  name,
  managed_by,
  credit_limit,
  CASE
    WHEN (has_permission('admin'::text) OR is_super_admin(auth.uid())) THEN phone
    ELSE concat('****', right(phone, 4))
  END AS phone,
  CASE
    WHEN (has_permission('admin'::text) OR is_super_admin(auth.uid())) THEN address
    ELSE COALESCE(split_part(address, ','::text, 1), '***'::text)
  END AS address,
  CASE
    WHEN (has_permission('admin'::text) OR is_super_admin(auth.uid())) THEN id_number
    ELSE concat('****', right(COALESCE(id_number, ''::text), 4))
  END AS id_number,
  CASE
    WHEN (has_permission('admin'::text) OR is_super_admin(auth.uid())) THEN registration_number
    ELSE concat('****', right(COALESCE(registration_number, ''::text), 4))
  END AS registration_number,
  created_at,
  updated_at
FROM customers
WHERE (
  auth.uid() IS NOT NULL
  AND strict_company_check(company_id)
  AND (
    is_super_admin(auth.uid())
    OR has_permission('admin'::text)
    OR (has_permission('sales'::text) AND (managed_by = auth.uid() OR managed_by IS NULL))
  )
);
