
-- ============================================================
-- SECURE INVOICES & INVOICE_ITEMS TABLES
-- Restrict direct base table access; enforce RBAC
-- ============================================================

-- Step 1: Drop the overly permissive ALL policy on invoices
DROP POLICY IF EXISTS "invoices_strict_isolation" ON public.invoices;

-- Step 2: Create role-based policies on invoices base table

-- Admins get full access to base table (with company isolation)
CREATE POLICY "admin_full_invoices_access"
ON public.invoices
FOR ALL
TO authenticated
USING (
  strict_company_check(company_id)
  AND (rbac_check('admin'::text) OR rbac_check('super_admin'::text))
)
WITH CHECK (
  strict_company_check(company_id)
  AND (rbac_check('admin'::text) OR rbac_check('super_admin'::text))
);

-- Sales users can INSERT/UPDATE invoices (for creating sales invoices)
CREATE POLICY "sales_manage_invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  strict_company_check(company_id)
  AND rbac_check('sales'::text)
);

CREATE POLICY "sales_update_invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  strict_company_check(company_id)
  AND rbac_check('sales'::text)
)
WITH CHECK (
  strict_company_check(company_id)
  AND rbac_check('sales'::text)
);

-- Purchases users can INSERT/UPDATE invoices (for creating purchase invoices)
CREATE POLICY "purchases_manage_invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  strict_company_check(company_id)
  AND rbac_check('purchases'::text)
);

CREATE POLICY "purchases_update_invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  strict_company_check(company_id)
  AND rbac_check('purchases'::text)
)
WITH CHECK (
  strict_company_check(company_id)
  AND rbac_check('purchases'::text)
);

-- Step 3: Drop the overly permissive ALL policy on invoice_items
DROP POLICY IF EXISTS "invoice_items_via_invoice" ON public.invoice_items;

-- Admin full access to invoice_items
CREATE POLICY "admin_full_invoice_items_access"
ON public.invoice_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND (rbac_check('admin'::text) OR rbac_check('super_admin'::text))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND (rbac_check('admin'::text) OR rbac_check('super_admin'::text))
  )
);

-- Sales users can manage invoice items
CREATE POLICY "sales_manage_invoice_items"
ON public.invoice_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND rbac_check('sales'::text)
  )
);

CREATE POLICY "sales_update_invoice_items"
ON public.invoice_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND rbac_check('sales'::text)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND rbac_check('sales'::text)
  )
);

-- Purchases users can manage invoice items
CREATE POLICY "purchases_manage_invoice_items"
ON public.invoice_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND rbac_check('purchases'::text)
  )
);

CREATE POLICY "purchases_update_invoice_items"
ON public.invoice_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND rbac_check('purchases'::text)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND rbac_check('purchases'::text)
  )
);

-- Step 4: Recreate invoices_safe view with security_barrier and RBAC
DROP VIEW IF EXISTS public.invoices_safe;
CREATE VIEW public.invoices_safe
WITH (security_barrier=true) AS
  SELECT 
    inv.id,
    inv.company_id,
    inv.invoice_number,
    inv.invoice_type,
    inv.customer_id,
    inv.supplier_id,
    inv.customer_name,
    CASE
      WHEN has_admin_or_super_admin() THEN inv.customer_vat_number
      WHEN inv.customer_vat_number IS NOT NULL AND length(inv.customer_vat_number) > 4 
        THEN '••••' || right(inv.customer_vat_number, 4)
      ELSE inv.customer_vat_number
    END AS customer_vat_number,
    CASE
      WHEN has_admin_or_super_admin() THEN inv.customer_address
      WHEN inv.customer_address IS NOT NULL THEN '(عنوان محمي)'::text
      ELSE NULL::text
    END AS customer_address,
    inv.invoice_date,
    inv.due_date,
    inv.subtotal,
    inv.discount_amount,
    inv.taxable_amount,
    inv.vat_rate,
    inv.vat_amount,
    inv.total,
    inv.amount_paid,
    inv.payment_status,
    inv.payment_method,
    inv.zatca_qr,
    inv.zatca_invoice_hash,
    inv.zatca_uuid,
    inv.zatca_status,
    inv.status,
    inv.sale_id,
    inv.journal_entry_id,
    inv.fiscal_year_id,
    inv.notes,
    CASE
      WHEN has_admin_or_super_admin() THEN inv.internal_notes
      ELSE NULL::text
    END AS internal_notes,
    inv.created_by,
    inv.created_at,
    inv.updated_at
  FROM public.invoices inv
  WHERE inv.company_id = get_user_company_id(auth.uid())
    AND (
      rbac_check('sales'::text)
      OR rbac_check('purchases'::text)
      OR rbac_check('admin'::text)
      OR rbac_check('super_admin'::text)
    );
