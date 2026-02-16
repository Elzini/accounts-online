
-- Drop old policies
DROP POLICY IF EXISTS "Users can view fingerprint devices for their company" ON public.hr_fingerprint_devices;
DROP POLICY IF EXISTS "Users can insert fingerprint devices for their company" ON public.hr_fingerprint_devices;
DROP POLICY IF EXISTS "Users can update fingerprint devices for their company" ON public.hr_fingerprint_devices;
DROP POLICY IF EXISTS "Users can delete fingerprint devices for their company" ON public.hr_fingerprint_devices;

-- Create new policies matching existing pattern
CREATE POLICY "strict_isolation" ON public.hr_fingerprint_devices
  FOR ALL USING (strict_company_check(company_id));
