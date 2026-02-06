
-- =====================================================
-- Harden financing_companies: block ALL direct SELECT access
-- Force all reads through the safe view (excludes api_key_encrypted)
-- =====================================================

-- Step 1: Drop the conflicting SELECT policy that allows direct access
DROP POLICY IF EXISTS "View financing companies via safe view" ON public.financing_companies;
DROP POLICY IF EXISTS "No direct select - use safe view" ON public.financing_companies;

-- Step 2: Create a single strict SELECT policy that blocks ALL direct reads
-- Only super_admin can directly query the base table (for emergency/audit)
CREATE POLICY "financing_companies_select_super_admin_only"
ON public.financing_companies
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Step 3: Recreate the safe view WITHOUT security_invoker (so it can bypass base table RLS)
-- and WITH security_barrier to prevent predicate pushdown attacks
DROP VIEW IF EXISTS public.financing_companies_safe;

CREATE VIEW public.financing_companies_safe
WITH (security_barrier=true) AS
SELECT 
  fc.id,
  fc.company_id,
  fc.name,
  fc.bank_name,
  fc.contact_person,
  fc.phone,
  fc.email,
  fc.api_endpoint,
  fc.commission_rate,
  fc.notes,
  fc.is_active,
  fc.created_at,
  fc.updated_at
  -- api_key_encrypted is INTENTIONALLY EXCLUDED
FROM public.financing_companies fc
WHERE fc.company_id = get_user_company_id(auth.uid())
  AND (rbac_check('sales') OR rbac_check('admin'));

-- Step 4: Grant access to the safe view for authenticated users
GRANT SELECT ON public.financing_companies_safe TO authenticated;

-- Step 5: Revoke any anon access
REVOKE ALL ON public.financing_companies FROM anon;
REVOKE ALL ON public.financing_companies_safe FROM anon;
