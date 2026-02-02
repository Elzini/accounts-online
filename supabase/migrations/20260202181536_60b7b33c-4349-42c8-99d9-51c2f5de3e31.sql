-- Allow unauthenticated visitors to read global auth (login/register) UI settings
-- This is required so the login pages can show the configured logo, titles, and colors.

CREATE POLICY "Public can read global auth settings"
ON public.app_settings
FOR SELECT
TO public
USING (
  company_id IS NULL
  AND (
    key LIKE 'login_%'
    OR key LIKE 'register_%'
  )
);