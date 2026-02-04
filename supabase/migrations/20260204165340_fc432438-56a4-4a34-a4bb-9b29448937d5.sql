-- Add sms_pin_id column to user_2fa table for Infobip OTP verification
ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS sms_pin_id TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_2fa.sms_pin_id IS 'Infobip PIN ID for SMS OTP verification - temporary storage during verification flow';