
-- Add missing columns to tenant schema journal_entries tables
DO $$
DECLARE
  v_schema TEXT;
BEGIN
  FOR v_schema IN 
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  LOOP
    -- Add reference_type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = v_schema AND table_name = 'journal_entries' AND column_name = 'reference_type') THEN
      EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN reference_type text', v_schema);
    END IF;
    
    -- Add reference_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = v_schema AND table_name = 'journal_entries' AND column_name = 'reference_id') THEN
      EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN reference_id uuid', v_schema);
    END IF;
    
    -- Add synced_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = v_schema AND table_name = 'journal_entries' AND column_name = 'synced_at') THEN
      EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN synced_at timestamptz', v_schema);
    END IF;
  END LOOP;
END $$;
