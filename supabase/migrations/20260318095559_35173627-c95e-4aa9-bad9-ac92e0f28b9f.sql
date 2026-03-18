
-- Remove the weaker permissive UPDATE policy that bypasses admin check
DROP POLICY IF EXISTS "Company isolation update" ON public.backups;
