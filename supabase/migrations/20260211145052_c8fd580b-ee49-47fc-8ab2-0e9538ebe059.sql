
-- Fix Security Definer views by recreating them with security_invoker = on

-- 1. Fix fiscal_years_public
DROP VIEW IF EXISTS public.fiscal_years_public;
CREATE VIEW public.fiscal_years_public 
WITH (security_invoker = on)
AS
SELECT id, name, start_date, end_date, is_current
FROM fiscal_years
WHERE status = 'open' OR status = 'active';

-- 2. Fix invoices_safe
DROP VIEW IF EXISTS public.invoices_safe;
CREATE VIEW public.invoices_safe 
WITH (security_invoker = on)
AS
SELECT id, company_id, invoice_number, invoice_type, customer_id, supplier_id, customer_name,
  CASE WHEN has_admin_or_super_admin() THEN customer_vat_number
       WHEN customer_vat_number IS NOT NULL AND length(customer_vat_number) > 4 THEN '••••' || right(customer_vat_number, 4)
       ELSE customer_vat_number END AS customer_vat_number,
  CASE WHEN has_admin_or_super_admin() THEN customer_address
       WHEN customer_address IS NOT NULL THEN '(عنوان محمي)'
       ELSE NULL END AS customer_address,
  invoice_date, due_date, subtotal, discount_amount, taxable_amount, vat_rate, vat_amount, total,
  amount_paid, payment_status, payment_method, zatca_qr, zatca_invoice_hash, zatca_uuid, zatca_status,
  status, sale_id, journal_entry_id, fiscal_year_id, notes,
  CASE WHEN has_admin_or_super_admin() THEN internal_notes ELSE NULL END AS internal_notes,
  created_by, created_at, updated_at
FROM invoices inv
WHERE company_id = get_user_company_id(auth.uid())
  AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR rbac_check('super_admin'));

-- 3. Fix suppliers_safe
DROP VIEW IF EXISTS public.suppliers_safe;
CREATE VIEW public.suppliers_safe 
WITH (security_invoker = on)
AS
SELECT id, company_id, name,
  CASE WHEN id_number IS NULL THEN NULL
       WHEN length(id_number) <= 4 THEN id_number
       ELSE '••••••' || right(id_number, 4) END AS id_number_masked,
  CASE WHEN registration_number IS NULL THEN NULL
       WHEN length(registration_number) <= 4 THEN registration_number
       ELSE '••••••' || right(registration_number, 4) END AS registration_number_masked,
  mask_phone(phone) AS phone_masked,
  address, notes, created_at, updated_at
FROM suppliers s
WHERE company_id = get_user_company_id(auth.uid())
  AND (rbac_check('purchases') OR rbac_check('admin') OR rbac_check('super_admin'));

-- 4. Fix financing_companies_safe
DROP VIEW IF EXISTS public.financing_companies_safe;
CREATE VIEW public.financing_companies_safe 
WITH (security_invoker = on)
AS
SELECT id, company_id, name, bank_name, contact_person, phone, email, api_endpoint,
  commission_rate, notes, is_active, created_at, updated_at
FROM financing_companies fc
WHERE company_id = get_user_company_id(auth.uid())
  AND (rbac_check('sales') OR rbac_check('admin'));
