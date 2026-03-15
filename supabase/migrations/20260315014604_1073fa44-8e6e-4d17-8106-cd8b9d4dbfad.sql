
-- Drop the existing policy
DROP POLICY IF EXISTS "user_roles_strict_isolation" ON public.user_roles;

-- Recreate with admin-only write access
-- USING: admins/super_admins see all company roles; users with 'users' permission can only SELECT (handled by separate select policy below)
-- WITH CHECK: only admin or super_admin can INSERT/UPDATE roles

-- Select policy: admin/super_admin can see all company roles
CREATE POLICY "user_roles_select_admin"
ON public.user_roles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (
    public.has_permission(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'super_admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = public.get_user_company_id(auth.uid())
  )
);

-- Select policy: users with 'users' permission can view roles in their company (read-only)
CREATE POLICY "user_roles_select_users_readonly"
ON public.user_roles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_permission(auth.uid(), 'users')
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = public.get_user_company_id(auth.uid())
  )
);

-- Insert policy: only admin or super_admin
CREATE POLICY "user_roles_insert_admin_only"
ON public.user_roles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (
    public.has_permission(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'super_admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = public.get_user_company_id(auth.uid())
  )
  AND (
    CASE
      WHEN public.has_permission(auth.uid(), 'super_admin') THEN true
      ELSE permission NOT IN ('super_admin', 'admin')
    END
  )
);

-- Update policy: only admin or super_admin
CREATE POLICY "user_roles_update_admin_only"
ON public.user_roles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  (
    public.has_permission(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'super_admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = public.get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  (
    public.has_permission(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'super_admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = public.get_user_company_id(auth.uid())
  )
  AND (
    CASE
      WHEN public.has_permission(auth.uid(), 'super_admin') THEN true
      ELSE permission NOT IN ('super_admin', 'admin')
    END
  )
);

-- Delete policy: only admin or super_admin
CREATE POLICY "user_roles_delete_admin_only"
ON public.user_roles
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  (
    public.has_permission(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'super_admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = public.get_user_company_id(auth.uid())
  )
);
