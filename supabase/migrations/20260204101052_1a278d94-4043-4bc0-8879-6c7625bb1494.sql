-- Create masking function for phone numbers
CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF phone IS NULL OR LENGTH(phone) < 4 THEN
    RETURN phone;
  END IF;
  RETURN '••••••' || RIGHT(phone, 4);
END;
$$;

-- Recreate suppliers_safe view with correct fields
-- Address is NOT sensitive and should be shown normally
-- Only phone, id_number, and registration_number need masking
DROP VIEW IF EXISTS public.suppliers_safe;

CREATE VIEW public.suppliers_safe
WITH (security_invoker=on)
AS
SELECT 
  id,
  company_id,
  name,
  CASE 
    WHEN id_number IS NULL THEN NULL
    WHEN LENGTH(id_number) <= 4 THEN id_number
    ELSE '••••••' || RIGHT(id_number, 4)
  END as id_number_masked,
  CASE 
    WHEN registration_number IS NULL THEN NULL
    WHEN LENGTH(registration_number) <= 4 THEN registration_number
    ELSE '••••••' || RIGHT(registration_number, 4)
  END as registration_number_masked,
  public.mask_phone(phone) as phone_masked,
  address, -- Address is NOT masked - it's not sensitive
  notes,
  created_at,
  updated_at
FROM public.suppliers;

-- Grant access to the view
GRANT SELECT ON public.suppliers_safe TO authenticated;

-- Add comment documenting the security architecture
COMMENT ON VIEW public.suppliers_safe IS 'Safe view for suppliers table - masks phone, id_number, and registration_number. Address is shown normally. Use this view for general read operations. Only admins can access full data from base table.';