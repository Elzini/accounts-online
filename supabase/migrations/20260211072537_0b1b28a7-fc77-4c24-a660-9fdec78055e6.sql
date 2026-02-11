-- Allow super admin full access to menu_configuration for any company
CREATE POLICY "Super admin full access to menu_configuration"
ON public.menu_configuration
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));
