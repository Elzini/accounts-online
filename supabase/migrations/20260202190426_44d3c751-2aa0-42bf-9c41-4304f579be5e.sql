-- Create a public-safe view that excludes API key credentials
CREATE OR REPLACE VIEW public.financing_companies_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  company_id,
  name,
  bank_name,
  contact_person,
  phone,
  email,
  api_endpoint,
  -- api_key_encrypted is EXCLUDED for security
  commission_rate,
  notes,
  is_active,
  created_at,
  updated_at
FROM public.financing_companies;

-- Grant access to the view
GRANT SELECT ON public.financing_companies_safe TO authenticated;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "View financing_companies in company" ON public.financing_companies;
DROP POLICY IF EXISTS "Manage financing_companies in company" ON public.financing_companies;
DROP POLICY IF EXISTS "Financing secure select" ON public.financing_companies;
DROP POLICY IF EXISTS "Financing secure insert" ON public.financing_companies;
DROP POLICY IF EXISTS "Financing secure update" ON public.financing_companies;
DROP POLICY IF EXISTS "Financing secure delete" ON public.financing_companies;
DROP POLICY IF EXISTS "Insert financing companies in company" ON public.financing_companies;

-- Block direct SELECT on base table - force use of the safe view
-- Only service_role (edge functions) can read API keys directly
CREATE POLICY "No direct select - use safe view"
ON public.financing_companies
FOR SELECT
TO authenticated
USING (false);

-- Admin-only policies for data modification (INSERT/UPDATE/DELETE)
CREATE POLICY "Admin only - insert financing companies"
ON public.financing_companies
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

CREATE POLICY "Admin only - update financing companies"
ON public.financing_companies
FOR UPDATE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

CREATE POLICY "Admin only - delete financing companies"
ON public.financing_companies
FOR DELETE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Create RLS policy for the safe view (inherited from base table via security_invoker)
-- Users with sales or admin permission can view non-sensitive financing company data
CREATE POLICY "View financing companies via safe view"
ON public.financing_companies
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid()))
);