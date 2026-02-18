CREATE OR REPLACE FUNCTION public.sync_account_to_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema_name TEXT;
  short_id TEXT;
BEGIN
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  short_id := replace(NEW.company_id::text, '-', '_');
  v_schema_name := 'tenant_' || short_id;

  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata s WHERE s.schema_name = v_schema_name) THEN
    PERFORM create_tenant_schema(NEW.company_id);
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    EXECUTE format('
      INSERT INTO %I.account_categories (id, code, name, type, parent_id, description, is_system, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        parent_id = EXCLUDED.parent_id,
        description = EXCLUDED.description,
        synced_at = now()
    ', v_schema_name)
    USING NEW.id, NEW.code, NEW.name, NEW.type, NEW.parent_id, NEW.description, NEW.is_system, NEW.created_at, NEW.updated_at;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    EXECUTE format('DELETE FROM %I.account_categories WHERE id = $1', v_schema_name) USING OLD.id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;