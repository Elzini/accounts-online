-- Fix create_immutable_audit_log to use extensions schema for digest function
CREATE OR REPLACE FUNCTION public.create_immutable_audit_log(
    _user_id uuid, 
    _company_id uuid, 
    _action text, 
    _entity_type text, 
    _entity_id text DEFAULT NULL::text, 
    _old_data jsonb DEFAULT NULL::jsonb, 
    _new_data jsonb DEFAULT NULL::jsonb, 
    _ip_address text DEFAULT NULL::text, 
    _user_agent text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    new_id UUID;
    prev_hash TEXT;
    new_hash TEXT;
    seq_num BIGINT;
BEGIN
    SELECT integrity_hash, sequence_number INTO prev_hash, seq_num
    FROM public.audit_logs
    WHERE company_id = _company_id
    ORDER BY created_at DESC, sequence_number DESC
    LIMIT 1;

    seq_num := COALESCE(seq_num, 0) + 1;
    new_id := gen_random_uuid();

    new_hash := encode(
        extensions.digest(
            COALESCE(_user_id::TEXT, '') || 
            COALESCE(_company_id::TEXT, '') || 
            COALESCE(_action, '') || 
            COALESCE(_entity_type, '') || 
            COALESCE(_entity_id, '') || 
            COALESCE(_old_data::TEXT, '') || 
            COALESCE(_new_data::TEXT, '') || 
            COALESCE(prev_hash, 'GENESIS') ||
            seq_num::TEXT ||
            now()::TEXT,
            'sha256'
        ),
        'hex'
    );

    INSERT INTO public.audit_logs (
        id, user_id, company_id, action, entity_type, entity_id,
        old_data, new_data, ip_address, user_agent,
        integrity_hash, previous_hash, sequence_number, created_at
    ) VALUES (
        new_id, _user_id, _company_id, _action, _entity_type, _entity_id,
        _old_data, _new_data, _ip_address, _user_agent,
        new_hash, prev_hash, seq_num, now()
    );

    RETURN new_id;
END;
$function$;