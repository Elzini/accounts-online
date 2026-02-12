
-- Fix: ensure pgcrypto extension is available for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix generate_tenant_encryption_key to use pgcrypto properly
CREATE OR REPLACE FUNCTION public.generate_tenant_encryption_key(p_company_id UUID)
RETURNS void AS $$
DECLARE
  raw_key TEXT;
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
BEGIN
  raw_key := encode(gen_random_bytes(32), 'hex');
  INSERT INTO public.tenant_encryption_keys (company_id, key_encrypted)
  VALUES (p_company_id, encode(encrypt(raw_key::bytea, master_key::bytea, 'aes'), 'base64'))
  ON CONFLICT (company_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
