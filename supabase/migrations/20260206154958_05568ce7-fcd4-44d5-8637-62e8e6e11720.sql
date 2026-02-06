
-- Grant anon access to the public fiscal years view
-- This is safe because the view only exposes minimal non-sensitive fields (id, name, dates, is_current)
GRANT SELECT ON public.fiscal_years_public TO anon;
GRANT SELECT ON public.fiscal_years_public TO authenticated;

-- Since the view reads from fiscal_years which has RLS,
-- we need to recreate it with security_invoker = false so it bypasses RLS
-- (the view itself only exposes safe fields)
DROP VIEW IF EXISTS public.fiscal_years_public;

CREATE VIEW public.fiscal_years_public
WITH (security_invoker = false)
AS
SELECT id, name, start_date, end_date, is_current
FROM fiscal_years
WHERE status = 'open' OR status = 'active';

-- Re-grant after recreation
GRANT SELECT ON public.fiscal_years_public TO anon;
GRANT SELECT ON public.fiscal_years_public TO authenticated;
