-- Drop the existing super admin SELECT policy on the base table
DROP POLICY IF EXISTS "financing_companies_select_super_admin_only" ON public.financing_companies;

-- Create a restrictive SELECT policy that never allows direct base table reads
-- All reads should go through the safe view
CREATE POLICY "No direct SELECT on financing_companies"
ON public.financing_companies
FOR SELECT
USING (false);

-- Create a super admin safe view (without api_key_encrypted)
CREATE OR REPLACE VIEW public.financing_companies_admin
WITH (security_invoker = on) AS
SELECT 
  id, company_id, name, bank_name, contact_person,
  phone, email, api_endpoint, commission_rate,
  notes, is_active, created_at, updated_at,
  CASE WHEN api_key_encrypted IS NOT NULL THEN '********' ELSE NULL END as api_key_status
FROM public.financing_companies;

-- Grant access to the admin view
GRANT SELECT ON public.financing_companies_admin TO authenticated;
