-- Harden tenant journal-entry sync so tenant-schema drift never breaks core posting
CREATE OR REPLACE FUNCTION public.sync_journal_entry_to_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_schema_name TEXT;
  short_id TEXT;
  v_payload JSONB;
  v_has_status BOOLEAN := FALSE;
  v_has_synced_at BOOLEAN := FALSE;
BEGIN
  IF COALESCE(NEW.company_id, OLD.company_id) IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  short_id := replace(COALESCE(NEW.company_id, OLD.company_id)::text, '-', '_');
  v_schema_name := 'tenant_' || short_id;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.schemata s
    WHERE s.schema_name = v_schema_name
  ) THEN
    PERFORM create_tenant_schema(COALESCE(NEW.company_id, OLD.company_id));
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = v_schema_name
        AND table_name = 'journal_entries'
        AND column_name = 'status'
    ) INTO v_has_status;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = v_schema_name
        AND table_name = 'journal_entries'
        AND column_name = 'synced_at'
    ) INTO v_has_synced_at;

    v_payload := to_jsonb(NEW);

    IF v_has_status THEN
      v_payload := v_payload || jsonb_build_object(
        'status',
        CASE WHEN COALESCE(NEW.is_posted, false) THEN 'posted' ELSE 'draft' END
      );
    END IF;

    IF v_has_synced_at THEN
      v_payload := v_payload || jsonb_build_object('synced_at', now());
    END IF;

    BEGIN
      EXECUTE format('DELETE FROM %I.journal_entries WHERE id = $1', v_schema_name)
      USING NEW.id;

      EXECUTE format(
        'INSERT INTO %I.journal_entries SELECT * FROM jsonb_populate_record(NULL::%I.journal_entries, $1)',
        v_schema_name,
        v_schema_name
      ) USING v_payload;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'sync_journal_entry_to_tenant failed for company %: %', COALESCE(NEW.company_id, OLD.company_id), SQLERRM;
    END;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    BEGIN
      EXECUTE format('DELETE FROM %I.journal_entries WHERE id = $1', v_schema_name)
      USING OLD.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'sync_journal_entry_to_tenant delete failed for company %: %', OLD.company_id, SQLERRM;
    END;

    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;