
-- Remove the plaintext otp_code column from critical_operation_otps
ALTER TABLE critical_operation_otps DROP COLUMN IF EXISTS otp_code;
