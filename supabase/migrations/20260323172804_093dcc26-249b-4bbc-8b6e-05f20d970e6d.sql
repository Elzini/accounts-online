
-- Drop broken policies that use has_permission('super_admin')
DROP POLICY "Super admin can manage companies" ON public.companies;
DROP POLICY "Users can view own company" ON public.companies;
