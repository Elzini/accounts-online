-- Create a safe view for customers that masks sensitive identity data
-- Sales staff see masked versions; admins can access full data via base table

CREATE OR REPLACE VIEW public.customers_safe
WITH (security_invoker=on) AS
SELECT 
  id,
  company_id,
  name,
  phone,
  address,
  -- Mask ID number: show only last 4 digits for verification
  CASE 
    WHEN id_number IS NOT NULL AND length(id_number) > 4 
    THEN '••••••' || RIGHT(id_number, 4)
    ELSE NULL
  END as id_number_masked,
  -- Mask registration number: show only last 4 characters
  CASE 
    WHEN registration_number IS NOT NULL AND length(registration_number) > 4 
    THEN '••••' || RIGHT(registration_number, 4)
    ELSE NULL
  END as registration_number_masked,
  created_at,
  updated_at
FROM public.customers;

-- Grant access to the view
GRANT SELECT ON public.customers_safe TO authenticated;

-- Add comment explaining usage
COMMENT ON VIEW public.customers_safe IS 'Safe view for customers with masked sensitive data (ID numbers, registration numbers). Sales staff should use this view for general queries. Only use the base table when full identity verification is explicitly required by admin.';