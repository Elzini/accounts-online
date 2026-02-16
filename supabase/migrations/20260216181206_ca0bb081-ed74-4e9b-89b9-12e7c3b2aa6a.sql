
-- ===== Recruitment =====
CREATE TABLE public.recruitment_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type TEXT DEFAULT 'full_time',
  description TEXT,
  requirements TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  positions_count INT DEFAULT 1,
  status TEXT DEFAULT 'open',
  published_at TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recruitment_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage recruitment_jobs" ON public.recruitment_jobs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.recruitment_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  job_id UUID REFERENCES public.recruitment_jobs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  resume_url TEXT,
  stage TEXT DEFAULT 'new',
  rating INT DEFAULT 0,
  source TEXT,
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recruitment_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage recruitment_candidates" ON public.recruitment_candidates FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.recruitment_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  interviewer_name TEXT,
  interview_date TIMESTAMPTZ,
  interview_type TEXT DEFAULT 'onsite',
  feedback TEXT,
  rating INT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recruitment_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage recruitment_interviews" ON public.recruitment_interviews FOR ALL USING (true) WITH CHECK (true);

-- ===== Fleet =====
CREATE TABLE public.fleet_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  license_plate TEXT,
  model TEXT,
  brand TEXT,
  year INT,
  color TEXT,
  vin TEXT,
  fuel_type TEXT DEFAULT 'gasoline',
  odometer NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  driver_name TEXT,
  driver_phone TEXT,
  insurance_expiry DATE,
  registration_expiry DATE,
  purchase_date DATE,
  purchase_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage fleet_vehicles" ON public.fleet_vehicles FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.fleet_service_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_date DATE NOT NULL,
  odometer_at_service NUMERIC,
  cost NUMERIC DEFAULT 0,
  vendor TEXT,
  description TEXT,
  next_service_date DATE,
  next_service_odometer NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fleet_service_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage fleet_service_logs" ON public.fleet_service_logs FOR ALL USING (true) WITH CHECK (true);

-- ===== Maintenance =====
CREATE TABLE public.maintenance_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  code TEXT,
  category TEXT,
  location TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'operational',
  purchase_date DATE,
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage maintenance_equipment" ON public.maintenance_equipment FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.maintenance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  equipment_id UUID REFERENCES public.maintenance_equipment(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  maintenance_type TEXT DEFAULT 'corrective',
  requested_by TEXT,
  assigned_to TEXT,
  scheduled_date DATE,
  completed_date DATE,
  cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage maintenance_requests" ON public.maintenance_requests FOR ALL USING (true) WITH CHECK (true);

-- ===== Quality Control =====
CREATE TABLE public.quality_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  check_type TEXT DEFAULT 'incoming',
  product_name TEXT,
  batch_number TEXT,
  inspector_name TEXT,
  check_date DATE DEFAULT CURRENT_DATE,
  result TEXT DEFAULT 'pending',
  pass_rate NUMERIC,
  defects_found INT DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quality_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage quality_checks" ON public.quality_checks FOR ALL USING (true) WITH CHECK (true);

-- ===== Events =====
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'conference',
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  max_attendees INT,
  current_attendees INT DEFAULT 0,
  ticket_price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  organizer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage events" ON public.events FOR ALL USING (true) WITH CHECK (true);

-- ===== Surveys =====
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  description TEXT,
  survey_type TEXT DEFAULT 'customer',
  status TEXT DEFAULT 'draft',
  responses_count INT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage surveys" ON public.surveys FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.survey_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB,
  is_required BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage survey_questions" ON public.survey_questions FOR ALL USING (true) WITH CHECK (true);

-- ===== eLearning =====
CREATE TABLE public.elearning_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  instructor_name TEXT,
  duration_hours NUMERIC,
  price NUMERIC DEFAULT 0,
  enrolled_count INT DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.elearning_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage elearning_courses" ON public.elearning_courses FOR ALL USING (true) WITH CHECK (true);

-- ===== Knowledge Base =====
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[],
  author_name TEXT,
  is_published BOOLEAN DEFAULT false,
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage knowledge_articles" ON public.knowledge_articles FOR ALL USING (true) WITH CHECK (true);

-- ===== Internal Chat =====
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT DEFAULT 'public',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage chat_channels" ON public.chat_channels FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ===== E-Signature =====
CREATE TABLE public.signature_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  document_name TEXT NOT NULL,
  document_url TEXT,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  status TEXT DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  signature_data TEXT,
  sent_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage signature_requests" ON public.signature_requests FOR ALL USING (true) WITH CHECK (true);

-- ===== Planning =====
CREATE TABLE public.planning_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_name TEXT NOT NULL,
  role TEXT,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planning_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage planning_shifts" ON public.planning_shifts FOR ALL USING (true) WITH CHECK (true);

-- ===== Field Service =====
CREATE TABLE public.field_service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  technician_name TEXT,
  service_type TEXT,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new',
  duration_hours NUMERIC,
  cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.field_service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage field_service_orders" ON public.field_service_orders FOR ALL USING (true) WITH CHECK (true);

-- ===== PLM Products (supplement existing manufacturing_products) =====
CREATE TABLE public.plm_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  version TEXT DEFAULT 'v1.0',
  stage TEXT DEFAULT 'design',
  bom_reference TEXT,
  description TEXT,
  responsible TEXT,
  changes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plm_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage plm_products" ON public.plm_products FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.plm_engineering_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID REFERENCES public.plm_products(id) ON DELETE SET NULL,
  eco_number TEXT,
  title TEXT NOT NULL,
  change_type TEXT DEFAULT 'improvement',
  requested_by TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plm_engineering_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage plm_engineering_changes" ON public.plm_engineering_changes FOR ALL USING (true) WITH CHECK (true);

-- ===== SMS Marketing =====
CREATE TABLE public.sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  message_text TEXT,
  recipients_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage sms_campaigns" ON public.sms_campaigns FOR ALL USING (true) WITH CHECK (true);

-- ===== Social Marketing =====
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  content TEXT NOT NULL,
  platform TEXT DEFAULT 'all',
  media_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  likes_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage social_posts" ON public.social_posts FOR ALL USING (true) WITH CHECK (true);

-- ===== Appraisals (supplement existing hr_evaluations) =====
CREATE TABLE public.appraisals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_name TEXT NOT NULL,
  department TEXT,
  reviewer_name TEXT,
  period TEXT,
  overall_rating NUMERIC,
  goals_score NUMERIC,
  skills_score NUMERIC,
  feedback TEXT,
  employee_feedback TEXT,
  status TEXT DEFAULT 'draft',
  review_date DATE,
  next_review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appraisals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage appraisals" ON public.appraisals FOR ALL USING (true) WITH CHECK (true);

-- ===== POS Sessions =====
CREATE TABLE public.pos_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  cashier_name TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC,
  total_sales NUMERIC DEFAULT 0,
  total_transactions INT DEFAULT 0,
  status TEXT DEFAULT 'open',
  notes TEXT
);
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage pos_sessions" ON public.pos_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.pos_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  session_id UUID REFERENCES public.pos_sessions(id) ON DELETE SET NULL,
  order_number TEXT,
  customer_name TEXT,
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage pos_orders" ON public.pos_orders FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.pos_order_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.pos_order_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage pos_order_lines" ON public.pos_order_lines FOR ALL USING (true) WITH CHECK (true);
