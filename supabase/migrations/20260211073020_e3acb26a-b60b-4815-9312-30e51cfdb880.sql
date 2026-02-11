-- Super admin full access to dashboard_config
CREATE POLICY "Super admin full access to dashboard_config"
ON public.dashboard_config
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Super admin full access to app_settings (read)
CREATE POLICY "Super admin read all app_settings"
ON public.app_settings
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admin full access to app_settings (update)
CREATE POLICY "Super admin update all app_settings"
ON public.app_settings
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Super admin full access to app_settings (insert)
CREATE POLICY "Super admin insert all app_settings"
ON public.app_settings
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Super admin full access to app_settings (delete)
CREATE POLICY "Super admin delete all app_settings"
ON public.app_settings
FOR DELETE
USING (is_super_admin(auth.uid()));
