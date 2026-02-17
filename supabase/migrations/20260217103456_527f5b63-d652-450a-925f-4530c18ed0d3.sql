
-- Fix 24 overly permissive RLS policies (USING(true) on non-SELECT)
-- Replace with company-isolated policies using strict_company_check

-- 1. appraisals
DROP POLICY IF EXISTS "Users can manage appraisals" ON public.appraisals;
CREATE POLICY "Company users can manage appraisals" ON public.appraisals FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 2. elearning_courses
DROP POLICY IF EXISTS "Users can manage elearning_courses" ON public.elearning_courses;
CREATE POLICY "Company users can manage elearning_courses" ON public.elearning_courses FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 3. events
DROP POLICY IF EXISTS "Users can manage events" ON public.events;
CREATE POLICY "Company users can manage events" ON public.events FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 4. field_service_orders
DROP POLICY IF EXISTS "Users can manage field_service_orders" ON public.field_service_orders;
CREATE POLICY "Company users can manage field_service_orders" ON public.field_service_orders FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 5. fleet_service_logs
DROP POLICY IF EXISTS "Users can manage fleet_service_logs" ON public.fleet_service_logs;
CREATE POLICY "Company users can manage fleet_service_logs" ON public.fleet_service_logs FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 6. fleet_vehicles
DROP POLICY IF EXISTS "Users can manage fleet_vehicles" ON public.fleet_vehicles;
CREATE POLICY "Company users can manage fleet_vehicles" ON public.fleet_vehicles FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 7. knowledge_articles
DROP POLICY IF EXISTS "Users can manage knowledge_articles" ON public.knowledge_articles;
CREATE POLICY "Company users can manage knowledge_articles" ON public.knowledge_articles FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 8. maintenance_equipment
DROP POLICY IF EXISTS "Users can manage maintenance_equipment" ON public.maintenance_equipment;
CREATE POLICY "Company users can manage maintenance_equipment" ON public.maintenance_equipment FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 9. maintenance_requests
DROP POLICY IF EXISTS "Users can manage maintenance_requests" ON public.maintenance_requests;
CREATE POLICY "Company users can manage maintenance_requests" ON public.maintenance_requests FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 10. planning_shifts
DROP POLICY IF EXISTS "Users can manage planning_shifts" ON public.planning_shifts;
CREATE POLICY "Company users can manage planning_shifts" ON public.planning_shifts FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 11. plm_engineering_changes
DROP POLICY IF EXISTS "Users can manage plm_engineering_changes" ON public.plm_engineering_changes;
CREATE POLICY "Company users can manage plm_engineering_changes" ON public.plm_engineering_changes FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 12. plm_products
DROP POLICY IF EXISTS "Users can manage plm_products" ON public.plm_products;
CREATE POLICY "Company users can manage plm_products" ON public.plm_products FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 13. pos_orders
DROP POLICY IF EXISTS "Users can manage pos_orders" ON public.pos_orders;
CREATE POLICY "Company users can manage pos_orders" ON public.pos_orders FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 14. pos_order_lines (no company_id, linked via order_id → pos_orders)
DROP POLICY IF EXISTS "Users can manage pos_order_lines" ON public.pos_order_lines;
CREATE POLICY "Company users can manage pos_order_lines" ON public.pos_order_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM pos_orders o WHERE o.id = order_id AND strict_company_check(o.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM pos_orders o WHERE o.id = order_id AND strict_company_check(o.company_id)));

-- 15. pos_sessions
DROP POLICY IF EXISTS "Users can manage pos_sessions" ON public.pos_sessions;
CREATE POLICY "Company users can manage pos_sessions" ON public.pos_sessions FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 16. quality_checks
DROP POLICY IF EXISTS "Users can manage quality_checks" ON public.quality_checks;
CREATE POLICY "Company users can manage quality_checks" ON public.quality_checks FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 17. recruitment_candidates
DROP POLICY IF EXISTS "Users can manage recruitment_candidates" ON public.recruitment_candidates;
CREATE POLICY "Company users can manage recruitment_candidates" ON public.recruitment_candidates FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 18. recruitment_interviews
DROP POLICY IF EXISTS "Users can manage recruitment_interviews" ON public.recruitment_interviews;
CREATE POLICY "Company users can manage recruitment_interviews" ON public.recruitment_interviews FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 19. recruitment_jobs
DROP POLICY IF EXISTS "Users can manage recruitment_jobs" ON public.recruitment_jobs;
CREATE POLICY "Company users can manage recruitment_jobs" ON public.recruitment_jobs FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 20. signature_requests
DROP POLICY IF EXISTS "Users can manage signature_requests" ON public.signature_requests;
CREATE POLICY "Company users can manage signature_requests" ON public.signature_requests FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 21. sms_campaigns
DROP POLICY IF EXISTS "Users can manage sms_campaigns" ON public.sms_campaigns;
CREATE POLICY "Company users can manage sms_campaigns" ON public.sms_campaigns FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 22. social_posts
DROP POLICY IF EXISTS "Users can manage social_posts" ON public.social_posts;
CREATE POLICY "Company users can manage social_posts" ON public.social_posts FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 23. surveys
DROP POLICY IF EXISTS "Users can manage surveys" ON public.surveys;
CREATE POLICY "Company users can manage surveys" ON public.surveys FOR ALL TO authenticated
  USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- 24. survey_questions (no company_id, linked via survey_id → surveys)
DROP POLICY IF EXISTS "Users can manage survey_questions" ON public.survey_questions;
CREATE POLICY "Company users can manage survey_questions" ON public.survey_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM surveys s WHERE s.id = survey_id AND strict_company_check(s.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM surveys s WHERE s.id = survey_id AND strict_company_check(s.company_id)));
