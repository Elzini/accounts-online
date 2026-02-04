-- Add columns to user_2fa table for SMS-based 2FA
ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS two_fa_type text DEFAULT 'totp',
ADD COLUMN IF NOT EXISTS phone_number text;

-- Add comment for documentation
COMMENT ON COLUMN public.user_2fa.two_fa_type IS 'Type of 2FA: totp (app-based) or sms (Authentica)';
COMMENT ON COLUMN public.user_2fa.phone_number IS 'Phone number for SMS-based 2FA (E.164 format)';