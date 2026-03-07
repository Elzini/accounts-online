
-- Add missing columns to tenant schema journal_entries
DO $$
DECLARE
  schema_name TEXT := 'tenant_aafb750f_8c08_4a64_a2b9_bba3b91ebe18';
BEGIN
  EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN IF NOT EXISTS reference_type TEXT', schema_name);
  EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN IF NOT EXISTS reference_id UUID', schema_name);
  EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT now()', schema_name);
END $$;
