
-- Add a RESTRICTIVE policy to prevent users from changing their own company_id
-- RESTRICTIVE policies are ANDed with PERMISSIVE policies, so this will block
-- any UPDATE that tries to change company_id, even if profiles_update_own allows it.

CREATE POLICY "prevent_company_id_change"
ON public.profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (company_id = (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()));
