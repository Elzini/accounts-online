
-- Step 1: Drop SELECT policies that give purchase users direct access to base table PII
DROP POLICY IF EXISTS "Purchase users can view suppliers via safe view" ON public.suppliers;
DROP POLICY IF EXISTS "View suppliers in company" ON public.suppliers;

-- Step 2: "Admins can view full supplier data" and "Super admins full supplier access" remain - they need full access

-- Step 3: Recreate the safe view WITHOUT security_invoker (runs as owner, bypasses RLS)
-- Build access controls directly into the view query with security_barrier
DROP VIEW IF EXISTS public.suppliers_safe;
CREATE VIEW public.suppliers_safe
WITH (security_barrier=true) AS
  SELECT 
    s.id,
    s.company_id,
    s.name,
    CASE
      WHEN s.id_number IS NULL THEN NULL::text
      WHEN length(s.id_number) <= 4 THEN s.id_number
      ELSE '••••••' || right(s.id_number, 4)
    END AS id_number_masked,
    CASE
      WHEN s.registration_number IS NULL THEN NULL::text
      WHEN length(s.registration_number) <= 4 THEN s.registration_number
      ELSE '••••••' || right(s.registration_number, 4)
    END AS registration_number_masked,
    mask_phone(s.phone) AS phone_masked,
    s.address,
    s.notes,
    s.created_at,
    s.updated_at
  FROM public.suppliers s
  WHERE s.company_id = get_user_company_id(auth.uid())
    AND (
      rbac_check('purchases'::text) 
      OR rbac_check('admin'::text) 
      OR rbac_check('super_admin'::text)
    );
