-- Fix security issue: Restrict app_settings to authenticated users only
-- Drop the old policy that allowed public access
DROP POLICY IF EXISTS "Read app settings" ON public.app_settings;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can read app settings"
ON public.app_settings
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    company_id IS NULL OR 
    company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  )
);

-- Also fix UPDATE policy to require authentication for global settings
DROP POLICY IF EXISTS "Update app settings for company" ON public.app_settings;

CREATE POLICY "Update app settings for company"
ON public.app_settings
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    -- Only super admins can update global settings (company_id IS NULL)
    (company_id IS NULL AND is_super_admin(auth.uid())) OR
    -- Company admins can update their company settings
    (company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    ) AND is_admin(auth.uid()))
  )
);

-- Fix INSERT policy for app_settings
DROP POLICY IF EXISTS "Insert app settings for company" ON public.app_settings;

CREATE POLICY "Insert app settings for company"
ON public.app_settings
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Only super admins can insert global settings
    (company_id IS NULL AND is_super_admin(auth.uid())) OR
    -- Company admins can insert their company settings
    (company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    ) AND is_admin(auth.uid()))
  )
);

-- Fix security issue: Restrict default_company_settings to authenticated users
-- Drop the old policy that allowed completely public access
DROP POLICY IF EXISTS "Anyone can view default company settings" ON public.default_company_settings;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view default company settings"
ON public.default_company_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);