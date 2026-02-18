-- Make gen_random_bytes available in public schema by creating a wrapper
CREATE OR REPLACE FUNCTION public.gen_random_bytes(integer)
RETURNS bytea
LANGUAGE sql
VOLATILE
SET search_path = extensions
AS $$
  SELECT extensions.gen_random_bytes($1);
$$;