
DROP POLICY IF EXISTS "read_baselines" ON public.immutable_baselines;

CREATE POLICY "read_baselines" ON public.immutable_baselines
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND permission = 'super_admin'
    )
  );
