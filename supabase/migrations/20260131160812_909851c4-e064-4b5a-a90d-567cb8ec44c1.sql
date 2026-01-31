-- Drop the overly permissive insert policy on companies table
DROP POLICY IF EXISTS "Allow insert companies during signup" ON public.companies;

-- Companies should only be created by the database trigger (create_company_for_new_user)
-- which runs as SECURITY DEFINER. No direct client inserts should be allowed.
-- The trigger handles all company creation during user signup.

-- Create a new restrictive policy - only allow insert via the trigger (which bypasses RLS as SECURITY DEFINER)
-- Since create_company_for_new_user() is SECURITY DEFINER, it bypasses RLS and can insert
-- Client-side inserts will be blocked because no policy allows them
CREATE POLICY "No direct company inserts"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Note: Unauthenticated users (anon role) have no INSERT policy at all, 
-- so they cannot insert. The authenticated policy with "false" blocks all direct inserts.
-- The SECURITY DEFINER trigger can still create companies because it bypasses RLS.