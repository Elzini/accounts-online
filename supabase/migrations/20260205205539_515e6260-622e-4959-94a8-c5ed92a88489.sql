-- Create a secure public view with only the minimal fields needed for login
CREATE VIEW public.fiscal_years_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  start_date,
  end_date,
  is_current
FROM public.fiscal_years
WHERE status = 'open' OR status = 'active';

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.fiscal_years_public TO anon;
GRANT SELECT ON public.fiscal_years_public TO authenticated;

-- Drop the old public read policy that exposes all columns
DROP POLICY IF EXISTS "Public read fiscal years for login" ON public.fiscal_years;

-- Create a new restrictive policy - only authenticated users from the company can read
CREATE POLICY "Authenticated users can read fiscal years"
ON public.fiscal_years
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = fiscal_years.company_id
  )
);