-- ============================================================
-- Remove ALL current_setting('app.current_tenant') based policies
-- from ALL schemas (tenant-specific schemas).
-- These are exploitable: any session can SET app.current_tenant.
-- ============================================================

DO $$
DECLARE
  _rec record;
BEGIN
  FOR _rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE (qual ILIKE '%current_setting%' OR with_check ILIKE '%current_setting%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', _rec.policyname, _rec.schemaname, _rec.tablename);
    RAISE NOTICE 'Dropped policy % on %.%', _rec.policyname, _rec.schemaname, _rec.tablename;
  END LOOP;
END;
$$;