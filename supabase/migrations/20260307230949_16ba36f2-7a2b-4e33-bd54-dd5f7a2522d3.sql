-- Fix: The trg_sync_journal_line trigger references account_code/account_name columns 
-- that don't exist in the tenant schema journal_entry_lines tables.
-- Update the trigger to handle missing columns gracefully.

CREATE OR REPLACE FUNCTION public.sync_journal_line_to_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
  v_company_id UUID;
BEGIN
  -- Get company_id from parent journal entry
  SELECT company_id INTO v_company_id FROM public.journal_entries WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  IF v_company_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  short_id := replace(v_company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    BEGIN
      EXECUTE format('
        INSERT INTO %I.journal_entry_lines (id, journal_entry_id, account_id, description, debit, credit, cost_center_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          account_id = EXCLUDED.account_id,
          description = EXCLUDED.description,
          debit = EXCLUDED.debit,
          credit = EXCLUDED.credit
      ', schema_name)
      USING NEW.id, NEW.journal_entry_id, NEW.account_id, NEW.description, NEW.debit, NEW.credit, NEW.cost_center_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Tenant sync failed for journal_entry_lines %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    BEGIN
      EXECUTE format('DELETE FROM %I.journal_entry_lines WHERE id = $1', schema_name) USING OLD.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Tenant sync delete failed for journal_entry_lines %: %', OLD.id, SQLERRM;
    END;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- Clean orphan purchase batches (batches without cars)
DELETE FROM public.purchase_batches 
WHERE id NOT IN (SELECT DISTINCT batch_id FROM public.cars WHERE batch_id IS NOT NULL);