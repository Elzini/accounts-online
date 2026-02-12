
-- Fix: use extensions schema for pgcrypto
CREATE OR REPLACE FUNCTION public.generate_tenant_encryption_key(p_company_id UUID)
RETURNS void AS $$
DECLARE
  raw_key TEXT;
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
BEGIN
  raw_key := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.tenant_encryption_keys (company_id, key_encrypted)
  VALUES (p_company_id, encode(extensions.encrypt(raw_key::bytea, master_key::bytea, 'aes'), 'base64'))
  ON CONFLICT (company_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.tenant_encrypt(p_company_id UUID, p_data TEXT)
RETURNS TEXT AS $$
DECLARE
  enc_key TEXT;
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
  raw_key TEXT;
BEGIN
  SELECT key_encrypted INTO enc_key FROM public.tenant_encryption_keys WHERE company_id = p_company_id AND is_active = true;
  IF enc_key IS NULL THEN
    PERFORM public.generate_tenant_encryption_key(p_company_id);
    SELECT key_encrypted INTO enc_key FROM public.tenant_encryption_keys WHERE company_id = p_company_id AND is_active = true;
  END IF;
  raw_key := convert_from(extensions.decrypt(decode(enc_key, 'base64'), master_key::bytea, 'aes'), 'utf8');
  RETURN encode(extensions.encrypt(p_data::bytea, decode(raw_key, 'hex'), 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.tenant_decrypt(p_company_id UUID, p_encrypted TEXT)
RETURNS TEXT AS $$
DECLARE
  enc_key TEXT;
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
  raw_key TEXT;
BEGIN
  IF p_encrypted IS NULL THEN RETURN NULL; END IF;
  SELECT key_encrypted INTO enc_key FROM public.tenant_encryption_keys WHERE company_id = p_company_id AND is_active = true;
  IF enc_key IS NULL THEN RETURN NULL; END IF;
  raw_key := convert_from(extensions.decrypt(decode(enc_key, 'base64'), master_key::bytea, 'aes'), 'utf8');
  RETURN convert_from(extensions.decrypt(decode(p_encrypted, 'base64'), decode(raw_key, 'hex'), 'aes'), 'utf8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.rotate_tenant_encryption_key(p_company_id UUID)
RETURNS void AS $$
DECLARE
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
  new_raw_key TEXT;
BEGIN
  new_raw_key := encode(extensions.gen_random_bytes(32), 'hex');
  UPDATE public.tenant_encryption_keys
  SET key_encrypted = encode(extensions.encrypt(new_raw_key::bytea, master_key::bytea, 'aes'), 'base64'),
      key_version = key_version + 1, rotated_at = now(), updated_at = now()
  WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
