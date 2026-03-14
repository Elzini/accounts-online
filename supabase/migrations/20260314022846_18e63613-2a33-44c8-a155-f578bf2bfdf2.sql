
-- Drop the old permissive policies that allow privilege escalation
DROP POLICY IF EXISTS "Insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "View roles" ON public.user_roles;

-- Drop the existing strict isolation policy to recreate with escalation guard
DROP POLICY IF EXISTS "user_roles_strict_isolation" ON public.user_roles;

-- Recreate with privilege escalation prevention
CREATE POLICY "user_roles_strict_isolation" ON public.user_roles
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = user_roles.user_id
            AND public.can_access_with_permission(p.company_id, 'users')
        )
    )
    WITH CHECK (
        -- Super admins can assign any permission
        (EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.permission = 'super_admin'
        ))
        OR
        -- Non-super-admin users with 'users' permission can only assign non-privileged roles
        (
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.user_id = user_roles.user_id
                AND public.can_access_with_permission(p.company_id, 'users')
            )
            AND user_roles.permission NOT IN ('super_admin', 'admin')
        )
    );
