-- Fix tenant_encryption_config to match what provision_tenant_complete expects
ALTER TABLE public.tenant_encryption_config ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.tenant_encryption_config ADD COLUMN IF NOT EXISTS encrypted_tables text[];

-- Add unique constraint on tenant_id for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS tenant_encryption_config_tenant_id_key ON public.tenant_encryption_config (tenant_id);

-- Create missing tenant_backups table
CREATE TABLE IF NOT EXISTS public.tenant_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  schema_name text,
  status text DEFAULT 'pending',
  tables_included text[],
  backup_type text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access tenant backups" ON public.tenant_backups
  FOR SELECT TO authenticated USING (false);

-- Create missing security_audit_trail table  
CREATE TABLE IF NOT EXISTS public.security_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text DEFAULT 'info',
  tenant_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid,
  schema_name text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access security audit trail" ON public.security_audit_trail
  FOR SELECT TO authenticated USING (false);