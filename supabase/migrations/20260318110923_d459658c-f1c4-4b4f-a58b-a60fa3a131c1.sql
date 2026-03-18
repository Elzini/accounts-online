
-- Fix broken RLS policies on zatca_config: use profiles.user_id and admin-only access
CREATE POLICY "zatca_config_select_fixed" ON public.zatca_config
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid()
      AND p.company_id = zatca_config.company_id
      AND ur.permission IN ('admin'::user_permission, 'super_admin'::user_permission)
  )
);

CREATE POLICY "zatca_config_insert_fixed" ON public.zatca_config
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid()
      AND p.company_id = zatca_config.company_id
      AND ur.permission IN ('admin'::user_permission, 'super_admin'::user_permission)
  )
);

CREATE POLICY "zatca_config_update_fixed" ON public.zatca_config
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid()
      AND p.company_id = zatca_config.company_id
      AND ur.permission IN ('admin'::user_permission, 'super_admin'::user_permission)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid()
      AND p.company_id = zatca_config.company_id
      AND ur.permission IN ('admin'::user_permission, 'super_admin'::user_permission)
  )
);
