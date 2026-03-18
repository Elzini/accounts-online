
-- Create helper function for super_admin check
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND permission = 'super_admin'
  );
$$;

-- re_projects
DROP POLICY IF EXISTS "Users can manage their company re_projects" ON public.re_projects;
CREATE POLICY "Users can manage their company re_projects" ON public.re_projects FOR ALL USING (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- re_units
DROP POLICY IF EXISTS "Users can manage their company re_units" ON public.re_units;
CREATE POLICY "Users can manage their company re_units" ON public.re_units FOR ALL USING (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- re_contractors
DROP POLICY IF EXISTS "Users can manage their company re_contractors" ON public.re_contractors;
CREATE POLICY "Users can manage their company re_contractors" ON public.re_contractors FOR ALL USING (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- re_work_orders
DROP POLICY IF EXISTS "Users can manage their company re_work_orders" ON public.re_work_orders;
CREATE POLICY "Users can manage their company re_work_orders" ON public.re_work_orders FOR ALL USING (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- re_progress_billings
DROP POLICY IF EXISTS "Users can manage their company re_progress_billings" ON public.re_progress_billings;
CREATE POLICY "Users can manage their company re_progress_billings" ON public.re_progress_billings FOR ALL USING (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- re_installments
DROP POLICY IF EXISTS "Users can manage their company re_installments" ON public.re_installments;
CREATE POLICY "Users can manage their company re_installments" ON public.re_installments FOR ALL USING (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- re_project_phases
DROP POLICY IF EXISTS "Users can manage their company re_project_phases" ON public.re_project_phases;
CREATE POLICY "Users can manage their company re_project_phases" ON public.re_project_phases FOR ALL USING (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  OR public.is_super_admin(auth.uid())
);
