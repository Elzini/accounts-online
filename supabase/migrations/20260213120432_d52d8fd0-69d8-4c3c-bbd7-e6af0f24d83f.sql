
-- Fix the access_audit_log table in tenant schema to have entity_type column
DO $$
DECLARE
  tenant_schema TEXT := 'tenant_00000000_0000_0000_0000_000000000001';
BEGIN
  -- Check if entity_type column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = tenant_schema 
    AND table_name = 'access_audit_log' 
    AND column_name = 'entity_type'
  ) THEN
    EXECUTE format('ALTER TABLE %I.access_audit_log ADD COLUMN entity_type TEXT', tenant_schema);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = tenant_schema 
    AND table_name = 'access_audit_log' 
    AND column_name = 'entity_id'
  ) THEN
    EXECUTE format('ALTER TABLE %I.access_audit_log ADD COLUMN entity_id UUID', tenant_schema);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = tenant_schema 
    AND table_name = 'access_audit_log' 
    AND column_name = 'details'
  ) THEN
    EXECUTE format('ALTER TABLE %I.access_audit_log ADD COLUMN details JSONB', tenant_schema);
  END IF;
END $$;
