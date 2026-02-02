-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can read global auth settings" ON public.app_settings;

-- Create a more restrictive policy with explicit whitelist of safe keys
-- This prevents accidental exposure of future sensitive settings
CREATE POLICY "Public can read whitelisted global auth UI settings"
ON public.app_settings
FOR SELECT
TO public
USING (
  company_id IS NULL
  AND key IN (
    -- Login page UI settings (visual only, no secrets)
    'login_title',
    'login_subtitle',
    'login_bg_color',
    'login_card_color',
    'login_header_gradient_start',
    'login_header_gradient_end',
    'login_button_text',
    'login_logo_url',
    -- Register page UI settings (visual only, no secrets)
    'register_title',
    'register_subtitle',
    'register_button_text'
  )
);