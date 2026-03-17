
-- Drop the broken otp_insert policy
DROP POLICY IF EXISTS "otp_insert" ON critical_operation_otps;

-- Recreate with correct column (profiles.user_id instead of profiles.id)
CREATE POLICY "otp_insert" ON critical_operation_otps
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.company_id = critical_operation_otps.company_id
  )
);
