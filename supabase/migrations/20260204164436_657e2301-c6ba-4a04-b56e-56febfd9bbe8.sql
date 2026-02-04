-- Complete profiles security setup with all functions and policies in one transaction

-- First create the helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND permission = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Now add the DELETE policy
DROP POLICY IF EXISTS "Only super_admin can delete profiles" ON public.profiles;

CREATE POLICY "Only super_admin can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.is_super_admin()
);

-- Add security comment
COMMENT ON TABLE public.profiles IS 'User profiles linked to companies. RLS enforces strict isolation: users see only own profile or same-company profiles. Super admins have full access.';