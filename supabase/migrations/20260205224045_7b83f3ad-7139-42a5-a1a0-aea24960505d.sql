-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Admins can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create stricter SELECT policies that prevent enumeration
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Policy 2: Users can view profiles of users in the same company (for admin purposes)
CREATE POLICY "Users can view same company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND company_id IS NOT NULL 
  AND company_id = get_user_company_id_safe(auth.uid())
);

-- Policy 3: Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_super_admin(auth.uid()));