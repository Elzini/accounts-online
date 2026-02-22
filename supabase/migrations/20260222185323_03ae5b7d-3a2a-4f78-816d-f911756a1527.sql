
-- Drop the incorrect unique constraint on key alone
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_key_key;

-- Drop duplicate constraint
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_company_key_unique;
