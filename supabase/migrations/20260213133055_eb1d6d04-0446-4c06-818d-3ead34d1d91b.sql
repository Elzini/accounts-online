
-- Remove overly permissive company isolation policies on quotations
DROP POLICY IF EXISTS "Company isolation select" ON public.quotations;
DROP POLICY IF EXISTS "Company isolation insert" ON public.quotations;
DROP POLICY IF EXISTS "Company isolation update" ON public.quotations;
DROP POLICY IF EXISTS "Company isolation delete" ON public.quotations;
