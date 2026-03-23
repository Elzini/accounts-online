
-- Aggressively remove all legacy policies by looping until clean
DO $$
DECLARE
  i INT;
BEGIN
  -- Run the drop loop 20 times to ensure all duplicates are removed
  FOR i IN 1..20 LOOP
    BEGIN
      EXECUTE 'DROP POLICY "tenant_isolation_policy" ON public.suppliers';
    EXCEPTION WHEN undefined_object THEN EXIT;
    END;
  END LOOP;
  
  FOR i IN 1..20 LOOP
    BEGIN
      EXECUTE 'DROP POLICY "tenant_policy_suppliers" ON public.suppliers';
    EXCEPTION WHEN undefined_object THEN EXIT;
    END;
  END LOOP;
END $$;
