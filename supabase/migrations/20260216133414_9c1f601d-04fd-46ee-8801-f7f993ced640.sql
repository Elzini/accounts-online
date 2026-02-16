
-- Fingerprint devices table
CREATE TABLE public.hr_fingerprint_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  device_model TEXT DEFAULT 'ZKTeco',
  serial_number TEXT,
  ip_address TEXT,
  port INTEGER DEFAULT 4370,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  total_employees INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add fingerprint source to attendance
ALTER TABLE public.employee_attendance 
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES public.hr_fingerprint_devices(id);

-- Enable RLS
ALTER TABLE public.hr_fingerprint_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view fingerprint devices for their company"
  ON public.hr_fingerprint_devices FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert fingerprint devices for their company"
  ON public.hr_fingerprint_devices FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update fingerprint devices for their company"
  ON public.hr_fingerprint_devices FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete fingerprint devices for their company"
  ON public.hr_fingerprint_devices FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_hr_fingerprint_devices_updated_at
  BEFORE UPDATE ON public.hr_fingerprint_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
