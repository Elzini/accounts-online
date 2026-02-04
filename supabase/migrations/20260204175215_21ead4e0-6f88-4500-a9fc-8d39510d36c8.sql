
-- Drop the existing view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.invoices_safe;

-- Create the safe view with SECURITY INVOKER (default, but explicit for clarity)
-- The has_admin_or_super_admin function is SECURITY DEFINER which is correct
-- The view itself should use INVOKER to respect RLS on underlying table
CREATE VIEW public.invoices_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  company_id,
  invoice_number,
  invoice_type,
  customer_id,
  supplier_id,
  customer_name,
  -- Mask VAT number for non-admin users (show only last 4 characters)
  CASE 
    WHEN public.has_admin_or_super_admin() THEN customer_vat_number
    WHEN customer_vat_number IS NOT NULL THEN 
      CONCAT('****', RIGHT(customer_vat_number, 4))
    ELSE NULL
  END AS customer_vat_number,
  -- Mask address for non-admin users (show only city if present)
  CASE 
    WHEN public.has_admin_or_super_admin() THEN customer_address
    WHEN customer_address IS NOT NULL THEN 
      '(عنوان محمي)'
    ELSE NULL
  END AS customer_address,
  invoice_date,
  due_date,
  subtotal,
  discount_amount,
  taxable_amount,
  vat_rate,
  vat_amount,
  total,
  amount_paid,
  payment_status,
  payment_method,
  zatca_qr,
  zatca_invoice_hash,
  zatca_uuid,
  zatca_status,
  status,
  sale_id,
  journal_entry_id,
  fiscal_year_id,
  notes,
  internal_notes,
  created_by,
  created_at,
  updated_at
FROM public.invoices;

-- Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.invoices_safe TO authenticated;

-- Add comment to document the view purpose
COMMENT ON VIEW public.invoices_safe IS 'Safe view of invoices with masked sensitive customer data (VAT number, address) for non-admin users. Uses SECURITY INVOKER to respect RLS.';
