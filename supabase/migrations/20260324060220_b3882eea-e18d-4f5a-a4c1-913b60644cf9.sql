
-- Consolidate invoice_items: remove duplicate ALL + redundant per-operation when admin ALL covers them
-- admin_full_invoice_items_access (ALL) already covers admin CRUD
-- invoice_items_tenant_direct (ALL) is redundant with admin_full
DROP POLICY IF EXISTS "invoice_items_tenant_direct" ON invoice_items;
DROP POLICY IF EXISTS "admin_delete_invoice_items" ON invoice_items;
-- Keep: admin_full (ALL), sales SELECT/INSERT/UPDATE, purchases SELECT/INSERT/UPDATE = 7→5
-- Actually remove the admin ALL since per-role policies are more granular:
-- No, admin ALL is needed. Remove per-role duplicates that admin ALL covers.
-- Best: keep admin_full_invoice_items_access (ALL for admins) + sales/purchases SELECT+INSERT+UPDATE combined

-- Merge sales+purchases SELECT into one
DROP POLICY IF EXISTS "purchases_select_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "sales_select_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "purchases_manage_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "sales_manage_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "purchases_update_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "sales_update_invoice_items" ON invoice_items;

-- Replace with 3 consolidated policies
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "invoice_items_modify" ON invoice_items FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR is_super_admin(auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND strict_company_check(i.company_id)
    AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR is_super_admin(auth.uid()))
  )
);

-- Invoices: consolidate (8 → 5)
DROP POLICY IF EXISTS "purchases_select_invoices" ON invoices;
DROP POLICY IF EXISTS "sales_select_invoices" ON invoices;
DROP POLICY IF EXISTS "purchases_manage_invoices" ON invoices;
DROP POLICY IF EXISTS "sales_manage_invoices" ON invoices;
DROP POLICY IF EXISTS "purchases_update_invoices" ON invoices;
DROP POLICY IF EXISTS "sales_update_invoices" ON invoices;

CREATE POLICY "invoices_select" ON invoices FOR SELECT TO authenticated
USING (
  strict_company_check(company_id)
  AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR is_super_admin(auth.uid()))
);

CREATE POLICY "invoices_insert" ON invoices FOR INSERT TO authenticated
WITH CHECK (
  strict_company_check(company_id)
  AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR is_super_admin(auth.uid()))
);

CREATE POLICY "invoices_modify" ON invoices FOR UPDATE TO authenticated
USING (
  strict_company_check(company_id)
  AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR is_super_admin(auth.uid()))
)
WITH CHECK (
  strict_company_check(company_id)
  AND (rbac_check('sales') OR rbac_check('purchases') OR rbac_check('admin') OR is_super_admin(auth.uid()))
);
