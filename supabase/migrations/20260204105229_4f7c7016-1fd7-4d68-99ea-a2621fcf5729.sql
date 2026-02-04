-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Recreate policies with explicit authentication requirement
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can view company profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND company_id IS NOT NULL 
  AND company_id = (
    SELECT p.company_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.is_super_admin(auth.uid())
);