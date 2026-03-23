-- Create missing tenant_encryption_keys table
CREATE TABLE IF NOT EXISTS public.tenant_encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  algorithm text DEFAULT 'aes-256-cbc',
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, key_version)
);

ALTER TABLE public.tenant_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to tenant encryption keys" ON public.tenant_encryption_keys
  FOR SELECT TO authenticated
  USING (false);

-- Create missing tenant_encryption_config table
CREATE TABLE IF NOT EXISTS public.tenant_encryption_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  encryption_enabled boolean DEFAULT true,
  algorithm text DEFAULT 'aes-256-cbc',
  key_rotation_days integer DEFAULT 90,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_encryption_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to tenant encryption config" ON public.tenant_encryption_config
  FOR SELECT TO authenticated
  USING (false);