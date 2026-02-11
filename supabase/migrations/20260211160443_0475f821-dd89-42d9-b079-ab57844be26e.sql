
-- Add subdomain column to companies table for tenant routing
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subdomain text UNIQUE;

-- Create index for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_companies_subdomain ON public.companies(subdomain) WHERE subdomain IS NOT NULL;

-- Create a public function to resolve company by subdomain (no auth required)
CREATE OR REPLACE FUNCTION public.resolve_company_by_subdomain(p_subdomain text)
RETURNS TABLE(id uuid, name text, logo_url text, company_type public.company_activity_type)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.logo_url, c.company_type
  FROM public.companies c
  WHERE c.subdomain = lower(p_subdomain)
    AND c.is_active = true
  LIMIT 1;
$$;
