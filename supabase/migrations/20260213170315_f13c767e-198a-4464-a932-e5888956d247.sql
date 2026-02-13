-- Fix RLS policies for hr_employees: profiles.id != auth.uid(), should use profiles.user_id
DROP POLICY IF EXISTS "hr_employees_select" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_insert" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_update" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_delete" ON public.hr_employees;

CREATE POLICY "hr_employees_select" ON public.hr_employees FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "hr_employees_insert" ON public.hr_employees FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "hr_employees_update" ON public.hr_employees FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "hr_employees_delete" ON public.hr_employees FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix same issue for other HR tables
DROP POLICY IF EXISTS "hr_insurance_records_select" ON public.hr_insurance_records;
DROP POLICY IF EXISTS "hr_insurance_records_insert" ON public.hr_insurance_records;
DROP POLICY IF EXISTS "hr_insurance_records_update" ON public.hr_insurance_records;

CREATE POLICY "hr_insurance_records_select" ON public.hr_insurance_records FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "hr_insurance_records_insert" ON public.hr_insurance_records FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "hr_insurance_records_update" ON public.hr_insurance_records FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "hr_evaluations_select" ON public.hr_evaluations;
DROP POLICY IF EXISTS "hr_evaluations_insert" ON public.hr_evaluations;
DROP POLICY IF EXISTS "hr_evaluations_update" ON public.hr_evaluations;

CREATE POLICY "hr_evaluations_select" ON public.hr_evaluations FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "hr_evaluations_insert" ON public.hr_evaluations FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "hr_evaluations_update" ON public.hr_evaluations FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "hr_training_courses_select" ON public.hr_training_courses;
DROP POLICY IF EXISTS "hr_training_courses_insert" ON public.hr_training_courses;
DROP POLICY IF EXISTS "hr_training_courses_update" ON public.hr_training_courses;
DROP POLICY IF EXISTS "hr_training_courses_delete" ON public.hr_training_courses;

CREATE POLICY "hr_training_courses_select" ON public.hr_training_courses FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "hr_training_courses_insert" ON public.hr_training_courses FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "hr_training_courses_update" ON public.hr_training_courses FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "hr_training_courses_delete" ON public.hr_training_courses FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "hr_training_attendees_select" ON public.hr_training_attendees;
DROP POLICY IF EXISTS "hr_training_attendees_insert" ON public.hr_training_attendees;

CREATE POLICY "hr_training_attendees_select" ON public.hr_training_attendees FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "hr_training_attendees_insert" ON public.hr_training_attendees FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));