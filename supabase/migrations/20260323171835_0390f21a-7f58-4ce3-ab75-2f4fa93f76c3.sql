
-- Add missing SELECT policies for invoices table
CREATE POLICY "sales_select_invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (strict_company_check(company_id) AND rbac_check('sales'));

CREATE POLICY "purchases_select_invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (strict_company_check(company_id) AND rbac_check('purchases'));

-- Add missing SELECT policies for invoice_items table
CREATE POLICY "sales_select_invoice_items"
  ON public.invoice_items FOR SELECT
  TO authenticated
  USING (strict_company_check(company_id) AND rbac_check('sales'));

CREATE POLICY "purchases_select_invoice_items"
  ON public.invoice_items FOR SELECT
  TO authenticated
  USING (strict_company_check(company_id) AND rbac_check('purchases'));

-- Add DELETE policies for invoices (admin only)
CREATE POLICY "admin_delete_invoices"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (strict_company_check(company_id) AND rbac_check('admin'));

CREATE POLICY "admin_delete_invoice_items"
  ON public.invoice_items FOR DELETE
  TO authenticated
  USING (strict_company_check(company_id) AND rbac_check('admin'));
