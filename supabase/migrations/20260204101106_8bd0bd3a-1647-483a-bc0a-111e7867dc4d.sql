-- Fix function search path for mask_phone
CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF phone IS NULL OR LENGTH(phone) < 4 THEN
    RETURN phone;
  END IF;
  RETURN '••••••' || RIGHT(phone, 4);
END;
$$;