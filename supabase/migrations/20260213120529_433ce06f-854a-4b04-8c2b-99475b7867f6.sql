
-- Fix audit trigger to use correct column names and make table_name nullable
DO $$
DECLARE
  tenant_schema TEXT := 'tenant_00000000_0000_0000_0000_000000000001';
BEGIN
  -- Make table_name nullable since the trigger uses entity_type instead
  EXECUTE format('ALTER TABLE %I.access_audit_log ALTER COLUMN table_name DROP NOT NULL', tenant_schema);
END $$;
