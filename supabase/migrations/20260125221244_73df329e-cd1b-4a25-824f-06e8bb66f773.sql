-- Drop existing policies on app_settings
DROP POLICY IF EXISTS "Manage settings in company" ON public.app_settings;
DROP POLICY IF EXISTS "View settings in company" ON public.app_settings;

-- Create proper RLS policies for app_settings

-- Allow anyone to read global settings (where company_id is null) and their own company settings
CREATE POLICY "Read app settings" 
ON public.app_settings 
FOR SELECT 
USING (
  company_id IS NULL 
  OR company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to insert settings for their own company
CREATE POLICY "Insert app settings for company" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (
  company_id IS NULL 
  OR company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to update settings for their own company
CREATE POLICY "Update app settings for company" 
ON public.app_settings 
FOR UPDATE 
USING (
  company_id IS NULL 
  OR company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to delete settings for their own company
CREATE POLICY "Delete app settings for company" 
ON public.app_settings 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
);