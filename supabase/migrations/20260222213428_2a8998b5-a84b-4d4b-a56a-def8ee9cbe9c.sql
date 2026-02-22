
-- Fix ALL audit trigger functions in tenant schema that use wrong column names
CREATE OR REPLACE FUNCTION tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b.audit_journal_entry_lines() 
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b AS $fn$
BEGIN
  INSERT INTO tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b.access_audit_log (user_id, action, table_name, record_id, details)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    jsonb_build_object('schema', TG_TABLE_SCHEMA, 'ts', now(), 'op', TG_OP));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $fn$;

-- Fix all other audit functions in this tenant schema
DO $$
DECLARE
  v_tables TEXT[] := ARRAY['account_categories','vouchers','sales','customers','suppliers','expenses','checks','cars','installments'];
  v_tbl TEXT;
BEGIN
  FOREACH v_tbl IN ARRAY v_tables LOOP
    EXECUTE format('
      CREATE OR REPLACE FUNCTION tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b.audit_%s() 
      RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
      SET search_path = tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b AS $fn$
      BEGIN
        INSERT INTO tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b.access_audit_log (user_id, action, table_name, record_id, details)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME,
          CASE WHEN TG_OP = ''DELETE'' THEN OLD.id ELSE NEW.id END,
          jsonb_build_object(''schema'', TG_TABLE_SCHEMA, ''ts'', now(), ''op'', TG_OP));
        IF TG_OP = ''DELETE'' THEN RETURN OLD; END IF; RETURN NEW;
      END; $fn$', v_tbl);
  END LOOP;
END;
$$;
