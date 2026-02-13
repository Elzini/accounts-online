-- Harden checks table: restrict to admin/purchases roles only
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can view checks in their company" ON public.checks;
DROP POLICY IF EXISTS "Users can insert checks in their company" ON public.checks;
DROP POLICY IF EXISTS "Users can update checks in their company" ON public.checks;
DROP POLICY IF EXISTS "Users can delete checks in their company" ON public.checks;
DROP POLICY IF EXISTS "strict_isolation" ON public.checks;

-- Create role-restricted policies
CREATE POLICY "Admin/purchases can view checks"
ON public.checks FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (is_admin(auth.uid()) OR has_permission(auth.uid(), 'purchases'::user_permission))
);

CREATE POLICY "Admin/purchases can insert checks"
ON public.checks FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (is_admin(auth.uid()) OR has_permission(auth.uid(), 'purchases'::user_permission))
);

CREATE POLICY "Admin/purchases can update checks"
ON public.checks FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (is_admin(auth.uid()) OR has_permission(auth.uid(), 'purchases'::user_permission))
);

CREATE POLICY "Admin can delete checks"
ON public.checks FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid())
  AND is_admin(auth.uid())
);