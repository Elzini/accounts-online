
DROP POLICY "super_admins_insert_system_change_alerts" ON public.system_change_alerts;
CREATE POLICY "super_admins_insert_system_change_alerts"
  ON public.system_change_alerts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));
