-- Remove the public access policy - all settings now require authentication
DROP POLICY IF EXISTS "Public can read whitelisted global auth UI settings" ON public.app_settings;