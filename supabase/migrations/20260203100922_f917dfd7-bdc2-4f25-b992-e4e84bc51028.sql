-- Fix suppliers table RLS policies to require 'purchases' permission
-- Drop overly permissive company isolation policies that bypass permission checks

DROP POLICY IF EXISTS "Company isolation select" ON public.suppliers;
DROP POLICY IF EXISTS "Company isolation insert" ON public.suppliers;
DROP POLICY IF EXISTS "Company isolation update" ON public.suppliers;
DROP POLICY IF EXISTS "Company isolation delete" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_strict_isolation" ON public.suppliers;

-- Keep the strict permission-based policies (already exist, recreate for clarity)
DROP POLICY IF EXISTS "View suppliers in company" ON public.suppliers;
DROP POLICY IF EXISTS "Insert suppliers in company" ON public.suppliers;
DROP POLICY IF EXISTS "Update suppliers in company" ON public.suppliers;
DROP POLICY IF EXISTS "Delete suppliers in company" ON public.suppliers;

-- Recreate strict policies requiring 'purchases' permission
CREATE POLICY "View suppliers in company" ON public.suppliers
FOR SELECT USING (
  is_super_admin(auth.uid()) 
  OR (
    company_id = get_user_company_id(auth.uid()) 
    AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Insert suppliers in company" ON public.suppliers
FOR INSERT WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
);

CREATE POLICY "Update suppliers in company" ON public.suppliers
FOR UPDATE USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
);

CREATE POLICY "Delete suppliers in company" ON public.suppliers
FOR DELETE USING (
  is_super_admin(auth.uid()) 
  OR (
    company_id = get_user_company_id(auth.uid()) 
    AND is_admin(auth.uid())
  )
);

-- Update suppliers_safe view to also enforce permission check
DROP VIEW IF EXISTS public.suppliers_safe;

CREATE VIEW public.suppliers_safe
WITH (security_invoker=on)
AS
SELECT 
  id,
  company_id,
  name,
  -- Mask sensitive contact information
  CASE 
    WHEN id_number IS NOT NULL AND LENGTH(id_number) > 4 
    THEN '••••••' || RIGHT(id_number, 4)
    ELSE id_number
  END as id_number_masked,
  CASE 
    WHEN registration_number IS NOT NULL AND LENGTH(registration_number) > 4 
    THEN '••••••' || RIGHT(registration_number, 4)
    ELSE registration_number
  END as registration_number_masked,
  CASE 
    WHEN phone IS NOT NULL AND LENGTH(phone) > 4 
    THEN '••••' || RIGHT(phone, 4)
    ELSE phone
  END as phone_masked,
  CASE 
    WHEN address IS NOT NULL AND LENGTH(address) > 10 
    THEN LEFT(address, 10) || '...'
    ELSE address
  END as address_masked,
  notes,
  created_at,
  updated_at
FROM public.suppliers;

-- Grant access to the safe view
GRANT SELECT ON public.suppliers_safe TO authenticated;

COMMENT ON VIEW public.suppliers_safe IS 'Safe view for suppliers with masked PII - inherits RLS from base table requiring purchases permission';