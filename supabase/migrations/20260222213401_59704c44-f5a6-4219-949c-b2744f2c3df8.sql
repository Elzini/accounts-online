
-- Fix audit trigger function for journal_entries in tenant schema
CREATE OR REPLACE FUNCTION tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b.audit_journal_entries() 
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b AS $fn$
BEGIN
  INSERT INTO tenant_3b6672f6_8639_4bab_ae4a_7a359528e03b.access_audit_log (user_id, action, table_name, record_id, details)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    jsonb_build_object('schema', TG_TABLE_SCHEMA, 'ts', now(), 'op', TG_OP));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $fn$;
