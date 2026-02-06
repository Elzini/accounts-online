
-- =====================================================
-- Harden profiles table: restrict ALL policies to authenticated role only
-- This prevents anonymous users from even attempting to match policies
-- =====================================================

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view same company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Drop existing INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles own update" ON public.profiles;
DROP POLICY IF EXISTS "Only super_admin can delete profiles" ON public.profiles;

-- Revoke any direct grants to anon role
REVOKE ALL ON public.profiles FROM anon;

-- =====================================================
-- Recreate policies with explicit TO authenticated
-- =====================================================

-- SELECT: User can view their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- SELECT: User can view same-company profiles (for team features)
CREATE POLICY "profiles_select_same_company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL
  AND company_id = get_user_company_id_safe(auth.uid())
);

-- SELECT: Super admins can view all profiles
CREATE POLICY "profiles_select_super_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- INSERT: Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Only super admins can delete profiles
CREATE POLICY "profiles_delete_super_admin"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_super_admin());
