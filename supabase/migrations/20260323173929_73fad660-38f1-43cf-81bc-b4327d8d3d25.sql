CREATE OR REPLACE FUNCTION public.generate_company_encryption_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.company_encryption_keys (company_id, key_hash, created_by)
  VALUES (
    NEW.id,
    encode(extensions.gen_random_bytes(32), 'hex'),
    auth.uid()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Encryption key generation failed: %', SQLERRM;
  RETURN NEW;
END;
$$;