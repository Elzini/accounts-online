
-- Work schedules table
CREATE TABLE IF NOT EXISTS public.hr_work_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'fixed',
  work_days TEXT[] DEFAULT ARRAY['Sun','Mon','Tue','Wed','Thu'],
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  break_duration_minutes INTEGER DEFAULT 60,
  late_tolerance_minutes INTEGER DEFAULT 15,
  early_leave_tolerance_minutes INTEGER DEFAULT 15,
  overtime_after_minutes INTEGER DEFAULT 30,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_work_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strict_isolation" ON public.hr_work_schedules FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Official holidays table
CREATE TABLE IF NOT EXISTS public.hr_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  end_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strict_isolation" ON public.hr_holidays FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Device attendance logs (raw data from devices before processing)
CREATE TABLE IF NOT EXISTS public.hr_device_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  device_id UUID REFERENCES public.hr_fingerprint_devices(id),
  employee_code TEXT NOT NULL,
  punch_time TIMESTAMPTZ NOT NULL,
  punch_type TEXT DEFAULT 'auto',
  verification_method TEXT DEFAULT 'fingerprint',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_processed BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'device',
  raw_data TEXT
);

ALTER TABLE public.hr_device_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strict_isolation" ON public.hr_device_logs FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));
