-- Drop the generic audit trigger on bank_transactions
DROP TRIGGER IF EXISTS audit_bank_transactions ON public.bank_transactions;

-- Create a specialized audit trigger function for bank_transactions
-- that looks up company_id from the parent bank_statements table
CREATE OR REPLACE FUNCTION public.audit_bank_transactions_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _company_id UUID;
  _entity_id UUID;
  _old_data JSONB;
  _new_data JSONB;
  _stmt_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _stmt_id := OLD.statement_id;
    _entity_id := OLD.id;
    _old_data := to_jsonb(OLD);
    _new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    _stmt_id := NEW.statement_id;
    _entity_id := NEW.id;
    _old_data := NULL;
    _new_data := to_jsonb(NEW);
  ELSE
    _stmt_id := COALESCE(NEW.statement_id, OLD.statement_id);
    _entity_id := COALESCE(NEW.id, OLD.id);
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
  END IF;

  -- Look up company_id from parent bank_statements
  SELECT company_id INTO _company_id
  FROM public.bank_statements
  WHERE id = _stmt_id;

  INSERT INTO public.audit_logs (
    user_id, company_id, entity_type, entity_id, action,
    old_data, new_data, sequence_number, previous_hash, integrity_hash
  )
  SELECT
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
    _company_id, TG_TABLE_NAME, _entity_id, TG_OP,
    _old_data, _new_data,
    COALESCE(MAX(sequence_number), 0) + 1,
    COALESCE(
      (SELECT integrity_hash FROM public.audit_logs
       WHERE company_id = _company_id
       ORDER BY sequence_number DESC LIMIT 1),
      'GENESIS'
    ),
    encode(sha256(random()::TEXT::BYTEA), 'hex')
  FROM public.audit_logs
  WHERE company_id = _company_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

-- Re-create the trigger using the specialized function
CREATE TRIGGER audit_bank_transactions
AFTER INSERT OR DELETE OR UPDATE ON public.bank_transactions
FOR EACH ROW EXECUTE FUNCTION audit_bank_transactions_trigger();