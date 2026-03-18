
-- Fix all broken RLS policies using profiles.id instead of profiles.user_id
-- Using strict_company_check for consistency with the rest of the system

-- === advanced_projects (all 4 policies broken) ===
DROP POLICY IF EXISTS "adv_projects_select" ON public.advanced_projects;
DROP POLICY IF EXISTS "adv_projects_insert" ON public.advanced_projects;
DROP POLICY IF EXISTS "adv_projects_update" ON public.advanced_projects;
DROP POLICY IF EXISTS "adv_projects_delete" ON public.advanced_projects;

CREATE POLICY "adv_projects_select" ON public.advanced_projects FOR SELECT TO authenticated USING (strict_company_check(company_id));
CREATE POLICY "adv_projects_insert" ON public.advanced_projects FOR INSERT TO authenticated WITH CHECK (strict_company_check(company_id));
CREATE POLICY "adv_projects_update" ON public.advanced_projects FOR UPDATE TO authenticated USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "adv_projects_delete" ON public.advanced_projects FOR DELETE TO authenticated USING (strict_company_check(company_id));

-- === project_tasks (all 4 policies broken) ===
DROP POLICY IF EXISTS "proj_tasks_select" ON public.project_tasks;
DROP POLICY IF EXISTS "proj_tasks_insert" ON public.project_tasks;
DROP POLICY IF EXISTS "proj_tasks_update" ON public.project_tasks;
DROP POLICY IF EXISTS "proj_tasks_delete" ON public.project_tasks;

CREATE POLICY "proj_tasks_select" ON public.project_tasks FOR SELECT TO authenticated USING (strict_company_check(company_id));
CREATE POLICY "proj_tasks_insert" ON public.project_tasks FOR INSERT TO authenticated WITH CHECK (strict_company_check(company_id));
CREATE POLICY "proj_tasks_update" ON public.project_tasks FOR UPDATE TO authenticated USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "proj_tasks_delete" ON public.project_tasks FOR DELETE TO authenticated USING (strict_company_check(company_id));

-- === zatca_invoices (all 3 policies broken, admin-only due to sensitivity) ===
DROP POLICY IF EXISTS "zatca_invoices_select" ON public.zatca_invoices;
DROP POLICY IF EXISTS "zatca_invoices_insert" ON public.zatca_invoices;
DROP POLICY IF EXISTS "zatca_invoices_update" ON public.zatca_invoices;

CREATE POLICY "zatca_invoices_select" ON public.zatca_invoices FOR SELECT TO authenticated
  USING (strict_company_check(company_id) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.permission IN ('admin', 'super_admin')));
CREATE POLICY "zatca_invoices_insert" ON public.zatca_invoices FOR INSERT TO authenticated
  WITH CHECK (strict_company_check(company_id) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.permission IN ('admin', 'super_admin')));
CREATE POLICY "zatca_invoices_update" ON public.zatca_invoices FOR UPDATE TO authenticated
  USING (strict_company_check(company_id) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.permission IN ('admin', 'super_admin')))
  WITH CHECK (strict_company_check(company_id) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.permission IN ('admin', 'super_admin')));

-- === hr_evaluations (only DELETE broken) ===
DROP POLICY IF EXISTS "hr_evaluations_delete" ON public.hr_evaluations;
CREATE POLICY "hr_evaluations_delete" ON public.hr_evaluations FOR DELETE TO authenticated USING (strict_company_check(company_id));

-- === hr_insurance_records (DELETE broken + duplicate old policies) ===
DROP POLICY IF EXISTS "hr_insurance_delete" ON public.hr_insurance_records;
DROP POLICY IF EXISTS "hr_insurance_select" ON public.hr_insurance_records;
DROP POLICY IF EXISTS "hr_insurance_update" ON public.hr_insurance_records;
DROP POLICY IF EXISTS "hr_insurance_insert" ON public.hr_insurance_records;
-- Keep the correct ones (hr_insurance_records_*), add missing delete
CREATE POLICY "hr_insurance_records_delete" ON public.hr_insurance_records FOR DELETE TO authenticated USING (strict_company_check(company_id));

-- === hr_training_attendees (DELETE and UPDATE broken) ===
DROP POLICY IF EXISTS "hr_training_attendees_delete" ON public.hr_training_attendees;
DROP POLICY IF EXISTS "hr_training_attendees_update" ON public.hr_training_attendees;
CREATE POLICY "hr_training_attendees_update" ON public.hr_training_attendees FOR UPDATE TO authenticated USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
CREATE POLICY "hr_training_attendees_delete" ON public.hr_training_attendees FOR DELETE TO authenticated USING (strict_company_check(company_id));
