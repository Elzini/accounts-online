
-- =====================================================
-- Clean up journal_entry_lines RLS: Replace per-company 
-- hardcoded policies with a single company_id-based policy
-- =====================================================

-- Drop all old hardcoded tenant_isolation_policy entries
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'journal_entry_lines' 
    AND policyname = 'tenant_isolation_policy'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.journal_entry_lines', pol.policyname);
  END LOOP;
END;
$$;

-- Add a single clean policy using the new company_id column
CREATE POLICY "jel_tenant_isolation_via_company_id"
ON public.journal_entry_lines
FOR ALL
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- Add direct company_id-based RLS to invoice_items
CREATE POLICY "invoice_items_tenant_direct"
ON public.invoice_items
FOR ALL
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);
