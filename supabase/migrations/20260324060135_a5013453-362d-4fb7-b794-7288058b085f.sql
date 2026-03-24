
-- =====================================================
-- OPTIMIZATION MIGRATION: RLS Consolidation + Trigger Cleanup + Audit Rotation
-- =====================================================

-- =====================================================
-- PART 1: RLS Policy Consolidation (9→4-5 per table)
-- =====================================================

-- === CUSTOMERS (9 → 5) ===
-- Remove old duplicate policies, keep granular RBAC ones
DROP POLICY IF EXISTS "Authenticated users can delete company customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert company customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view company customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update company customers" ON customers;

-- === APP_SETTINGS (9 → 5) ===
-- Remove old per-operation policies, keep strict_isolation + super_admin
DROP POLICY IF EXISTS "Delete app settings for company" ON app_settings;
DROP POLICY IF EXISTS "Authenticated users can read app settings" ON app_settings;

-- === INVOICE_ITEMS (9 → 5) ===
DROP POLICY IF EXISTS "invoice_items_select_via_invoice" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert_via_invoice" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_update_via_invoice" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete_via_invoice" ON invoice_items;

-- === BANK_RECONCILIATIONS (6 → 4) ===
DROP POLICY IF EXISTS "Admins can view company bank reconciliations" ON bank_reconciliations;
DROP POLICY IF EXISTS "Admins can insert company bank reconciliations" ON bank_reconciliations;
DROP POLICY IF EXISTS "Admins can update company bank reconciliations" ON bank_reconciliations;
DROP POLICY IF EXISTS "Admins can delete company bank reconciliations" ON bank_reconciliations;

-- === BANK_STATEMENTS (6 → 2) ===
DROP POLICY IF EXISTS "Admins can view company bank statements" ON bank_statements;
DROP POLICY IF EXISTS "Admins can insert company bank statements" ON bank_statements;
DROP POLICY IF EXISTS "Admins can update company bank statements" ON bank_statements;
DROP POLICY IF EXISTS "Admins can delete company bank statements" ON bank_statements;

-- === BANK_TRANSACTIONS (6 → 2) ===
DROP POLICY IF EXISTS "Admins can view bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Admins can insert bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Admins can update bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Admins can delete bank transactions" ON bank_transactions;

-- === FINANCING_COMPANIES (7 → 4) ===
DROP POLICY IF EXISTS "strict_isolation_delete" ON financing_companies;
DROP POLICY IF EXISTS "strict_isolation_insert" ON financing_companies;
DROP POLICY IF EXISTS "strict_isolation_update" ON financing_companies;

-- === IMPORTED_INVOICE_DATA (6 → 3) ===
DROP POLICY IF EXISTS "Users can delete their company imported data" ON imported_invoice_data;
DROP POLICY IF EXISTS "Users can insert their company imported data" ON imported_invoice_data;
DROP POLICY IF EXISTS "Users can update their company imported data" ON imported_invoice_data;

-- === INSTALLMENT_SALES (6 → 4) - remove duplicate INSERT ===
DROP POLICY IF EXISTS "Insert installment sales in company" ON installment_sales;

-- === PARTNER_DEALERSHIPS (6 → 4) - remove duplicate INSERT ===
DROP POLICY IF EXISTS "Insert partner dealerships in company" ON partner_dealerships;

-- === PREPAID_EXPENSES (6 → 4) - remove duplicate INSERT ===
DROP POLICY IF EXISTS "Users can insert prepaid expenses for their company" ON prepaid_expenses;
DROP POLICY IF EXISTS "Users can view prepaid expenses of their company" ON prepaid_expenses;

-- === PURCHASE_BATCHES (6 → 4) - remove duplicate INSERT ===
DROP POLICY IF EXISTS "Insert purchase batches in company" ON purchase_batches;

-- =====================================================
-- PART 2: Remove Redundant Triggers (Triple isolation → Single)
-- Keep enforce_company_binding, remove enforce_company_isolation & block_cross_tenant
-- (RLS already enforces isolation, triggers are defense-in-depth but 3 is excessive)
-- =====================================================

-- Customers: keep enforce_company_binding, remove 2 redundant
DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON customers;
DROP TRIGGER IF EXISTS trg_block_cross_tenant_customers ON customers;

-- Suppliers: keep enforce_company_binding, remove 2 redundant
DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON suppliers;
DROP TRIGGER IF EXISTS trg_block_cross_tenant_suppliers ON suppliers;

-- Cars: keep enforce_company_binding, remove 2 redundant
DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON cars;
DROP TRIGGER IF EXISTS trg_block_cross_tenant_cars ON cars;

-- Sales: keep enforce_company_binding, remove 2 redundant
DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON sales;
DROP TRIGGER IF EXISTS trg_block_cross_tenant_sales ON sales;

-- Account categories: keep trg_protect_system_accounts, remove redundant
DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON account_categories;
DROP TRIGGER IF EXISTS trg_block_cross_tenant_account_categories ON account_categories;

-- Journal entries: keep enforce_company_binding
DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON journal_entries;
DROP TRIGGER IF EXISTS trg_block_cross_tenant_journal_entries ON journal_entries;

-- Expenses: keep enforce_company_binding
DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON expenses;
DROP TRIGGER IF EXISTS trg_block_cross_tenant_expenses ON expenses;

-- Invoices
DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON invoices;
DROP TRIGGER IF EXISTS trg_block_cross_tenant_invoices ON invoices;

-- Sale items: remove duplicate company propagation
DROP TRIGGER IF EXISTS trg_auto_sale_items_company ON sale_items;

-- =====================================================
-- PART 3: Drop orphaned trigger functions (if no longer used)
-- =====================================================
DROP FUNCTION IF EXISTS enforce_company_isolation() CASCADE;
DROP FUNCTION IF EXISTS block_cross_tenant_access() CASCADE;

-- =====================================================
-- PART 4: Audit Log Rotation (Archive + Cleanup)
-- =====================================================

-- Create archive table
CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  LIKE public.audit_logs INCLUDING ALL
);

-- Enable RLS on archive
ALTER TABLE public.audit_logs_archive ENABLE ROW LEVEL SECURITY;

-- Archive table policies (admin read-only)
CREATE POLICY "Admin read archived audit logs"
ON public.audit_logs_archive FOR SELECT
TO authenticated
USING (
  (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
  AND strict_company_check(company_id)
);

-- Function to archive old audit logs (older than N days)
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer;
BEGIN
  -- Move old records to archive
  WITH moved AS (
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - (days_to_keep || ' days')::interval
    AND entity_type NOT IN ('integrity_check')  -- Keep integrity checks
    RETURNING *
  )
  INSERT INTO public.audit_logs_archive
  SELECT * FROM moved;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$;

-- Function to get audit log stats
CREATE OR REPLACE FUNCTION public.get_audit_log_stats()
RETURNS TABLE(
  active_count bigint,
  archive_count bigint,
  oldest_active timestamp with time zone,
  newest_active timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.audit_logs) as active_count,
    (SELECT COUNT(*) FROM public.audit_logs_archive) as archive_count,
    (SELECT MIN(created_at) FROM public.audit_logs) as oldest_active,
    (SELECT MAX(created_at) FROM public.audit_logs) as newest_active;
$$;
