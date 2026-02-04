
-- Create a function to check if user has admin permission
CREATE OR REPLACE FUNCTION public.has_admin_or_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND permission IN ('admin', 'super_admin')
  )
$$;

-- Create a safe view for invoices that masks sensitive data for non-admin users
CREATE OR REPLACE VIEW public.invoices_safe AS
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
COMMENT ON VIEW public.invoices_safe IS 'Safe view of invoices with masked sensitive customer data (VAT number, address) for non-admin users';
