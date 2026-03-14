
-- Add otp_hash column for storing hashed OTP codes
ALTER TABLE public.critical_operation_otps ADD COLUMN IF NOT EXISTS otp_hash text;

-- Restrict SELECT to only the requesting user (no admin branch)
DROP POLICY IF EXISTS "otp_select" ON public.critical_operation_otps;
CREATE POLICY "otp_select" ON public.critical_operation_otps
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid());
