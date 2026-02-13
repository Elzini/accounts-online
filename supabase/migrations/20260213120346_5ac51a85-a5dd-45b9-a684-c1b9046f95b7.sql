
CREATE OR REPLACE FUNCTION sync_journal_entry_to_tenant()
RETURNS TRIGGER AS $$
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
      INSERT INTO %I.journal_entries (id, entry_number, entry_date, description, status, total_debit, total_credit, reference_type, reference_id, fiscal_year_id, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      ON CONFLICT (id) DO UPDATE SET
        entry_number = EXCLUDED.entry_number,
        entry_date = EXCLUDED.entry_date,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        total_debit = EXCLUDED.total_debit,
        total_credit = EXCLUDED.total_credit,
        reference_type = EXCLUDED.reference_type,
        reference_id = EXCLUDED.reference_id,
        synced_at = now()
    ', v_schema_name)
    USING NEW.id, NEW.entry_number, NEW.entry_date, NEW.description, 
          CASE WHEN NEW.is_posted THEN 'posted' ELSE 'draft' END,
          NEW.total_debit, NEW.total_credit, NEW.reference_type, NEW.reference_id, NEW.fiscal_year_id, NEW.created_at, NEW.updated_at;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    EXECUTE format('DELETE FROM %I.journal_entries WHERE id = $1', v_schema_name) USING OLD.id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
