
-- Remove overly permissive backup policies that allow any company member to delete/insert
DROP POLICY IF EXISTS "Company isolation delete" ON public.backups;
DROP POLICY IF EXISTS "Company isolation insert" ON public.backups;
