-- Remove permissive strict_isolation policy that bypasses role checks on financing_contracts
DROP POLICY IF EXISTS "financing_contracts_strict_isolation" ON public.financing_contracts;