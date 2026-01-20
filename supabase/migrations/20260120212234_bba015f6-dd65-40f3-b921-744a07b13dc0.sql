-- Fix the permissive RLS policy on backup_schedules
DROP POLICY IF EXISTS "Users can manage their company backup schedule" ON public.backup_schedules;

CREATE POLICY "Users can insert their company backup schedule"
  ON public.backup_schedules
  FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their company backup schedule"
  ON public.backup_schedules
  FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their company backup schedule"
  ON public.backup_schedules
  FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));