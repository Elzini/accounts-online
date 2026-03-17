
-- Drop existing DELETE and INSERT policies to rebuild with stricter rules
DROP POLICY IF EXISTS "user_roles_delete_admin_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin_only" ON public.user_roles;

-- Rebuilt INSERT policy:
-- 1. Only admin/super_admin can insert
-- 2. Only within same company
-- 3. Admins cannot assign admin/super_admin roles
-- 4. Users cannot assign roles to themselves (prevent self-elevation)
CREATE POLICY "user_roles_insert_admin_only" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  (has_permission(auth.uid(), 'admin'::user_permission) OR has_permission(auth.uid(), 'super_admin'::user_permission))
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND user_roles.user_id <> auth.uid()
  AND CASE
    WHEN has_permission(auth.uid(), 'super_admin'::user_permission) THEN true
    ELSE permission NOT IN ('super_admin'::user_permission, 'admin'::user_permission)
  END
);

-- Rebuilt DELETE policy:
-- 1. Only admin/super_admin can delete
-- 2. Only within same company
-- 3. Non-super_admin cannot delete admin or super_admin roles
-- 4. Users cannot delete their own roles
CREATE POLICY "user_roles_delete_admin_only" ON public.user_roles
FOR DELETE TO authenticated
USING (
  (has_permission(auth.uid(), 'admin'::user_permission) OR has_permission(auth.uid(), 'super_admin'::user_permission))
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND user_roles.user_id <> auth.uid()
  AND CASE
    WHEN has_permission(auth.uid(), 'super_admin'::user_permission) THEN true
    ELSE permission NOT IN ('super_admin'::user_permission, 'admin'::user_permission)
  END
);
