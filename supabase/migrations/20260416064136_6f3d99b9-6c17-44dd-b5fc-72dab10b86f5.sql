
ALTER TABLE public.zatca_config
  ADD COLUMN IF NOT EXISTS compliance_secret TEXT,
  ADD COLUMN IF NOT EXISTS compliance_request_id TEXT,
  ADD COLUMN IF NOT EXISTS production_secret TEXT,
  ADD COLUMN IF NOT EXISTS production_request_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending';
