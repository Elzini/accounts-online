
-- Drop all conflicting SELECT policies on profiles
DROP POLICY IF EXISTS "Admins can view profiles in same company" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles company select" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_strict_isolation" ON public.profiles;

-- Create a single, clean SELECT policy that avoids recursion
-- Using SECURITY DEFINER function to avoid recursive RLS check

-- First, create a safe function to get user's company_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id_safe(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = uid LIMIT 1;
$$;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view company profiles"
ON public.profiles FOR SELECT
USING (
  public.is_super_admin(auth.uid()) 
  OR (
    company_id IS NOT NULL 
    AND company_id = public.get_user_company_id_safe(auth.uid())
    AND public.has_permission('admin')
  )
);
