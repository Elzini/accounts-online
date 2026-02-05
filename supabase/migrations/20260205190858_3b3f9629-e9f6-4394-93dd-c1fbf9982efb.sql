-- Allow anonymous users to read fiscal years for login page
CREATE POLICY "Public read fiscal years for login"
ON public.fiscal_years
FOR SELECT
TO anon
USING (true);