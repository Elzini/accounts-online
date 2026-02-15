
-- 1. Create trigger to prevent UPDATE on audit_logs (even from service_role/superuser functions)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$$;

-- Block UPDATE
DROP TRIGGER IF EXISTS prevent_audit_update ON public.audit_logs;
CREATE TRIGGER prevent_audit_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Block DELETE
DROP TRIGGER IF EXISTS prevent_audit_delete ON public.audit_logs;
CREATE TRIGGER prevent_audit_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 2. Create separate append-only hash verification table
CREATE TABLE IF NOT EXISTS public.audit_hash_chain (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  audit_log_id UUID NOT NULL,
  integrity_hash TEXT NOT NULL,
  previous_hash TEXT,
  sequence_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_hash_chain ENABLE ROW LEVEL SECURITY;

-- No one can UPDATE or DELETE hash chain entries
CREATE POLICY "hash_chain_no_update" ON public.audit_hash_chain
  FOR UPDATE TO authenticated USING (false);
CREATE POLICY "hash_chain_no_delete" ON public.audit_hash_chain
  FOR DELETE TO authenticated USING (false);
CREATE POLICY "hash_chain_no_insert" ON public.audit_hash_chain
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "hash_chain_select" ON public.audit_hash_chain
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));

-- Only service_role can insert
REVOKE INSERT ON public.audit_hash_chain FROM authenticated;
REVOKE INSERT ON public.audit_hash_chain FROM anon;
GRANT INSERT ON public.audit_hash_chain TO service_role;
GRANT SELECT ON public.audit_hash_chain TO authenticated;

-- Immutability triggers on hash chain table too
DROP TRIGGER IF EXISTS prevent_hash_chain_update ON public.audit_hash_chain;
CREATE TRIGGER prevent_hash_chain_update
  BEFORE UPDATE ON public.audit_hash_chain
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

DROP TRIGGER IF EXISTS prevent_hash_chain_delete ON public.audit_hash_chain;
CREATE TRIGGER prevent_hash_chain_delete
  BEFORE DELETE ON public.audit_hash_chain
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 3. Create trigger to auto-populate hash chain on audit_log INSERT
CREATE OR REPLACE FUNCTION public.audit_log_hash_chain_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_hash TEXT;
  v_sequence BIGINT;
  v_hash TEXT;
BEGIN
  -- Get previous hash
  SELECT integrity_hash, sequence_number INTO v_previous_hash, v_sequence
  FROM audit_hash_chain
  ORDER BY sequence_number DESC
  LIMIT 1;

  IF v_sequence IS NULL THEN
    v_sequence := 0;
  END IF;
  v_sequence := v_sequence + 1;

  -- Compute hash: SHA-256 of (previous_hash + audit_log_id + action + entity_type + created_at)
  v_hash := encode(
    sha256(
      convert_to(
        COALESCE(v_previous_hash, 'GENESIS') || '|' ||
        NEW.id::text || '|' ||
        NEW.action || '|' ||
        NEW.entity_type || '|' ||
        NEW.created_at::text,
        'UTF8'
      )
    ),
    'hex'
  );

  -- Update the audit_log record with hash info
  NEW.integrity_hash := v_hash;
  NEW.previous_hash := v_previous_hash;
  NEW.sequence_number := v_sequence;

  -- Insert into separate hash chain table
  INSERT INTO audit_hash_chain (audit_log_id, integrity_hash, previous_hash, sequence_number)
  VALUES (NEW.id, v_hash, v_previous_hash, v_sequence);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_log_hash_chain ON public.audit_logs;
CREATE TRIGGER audit_log_hash_chain
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_hash_chain_insert();

-- 4. Create verification function that cross-checks both tables
CREATE OR REPLACE FUNCTION public.verify_audit_chain_integrity(p_company_id UUID DEFAULT NULL)
RETURNS TABLE (
  is_valid BOOLEAN,
  total_logs BIGINT,
  total_hashes BIGINT,
  mismatches BIGINT,
  missing_hashes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH log_count AS (
    SELECT COUNT(*) AS cnt FROM audit_logs
    WHERE (p_company_id IS NULL OR company_id = p_company_id)
      AND integrity_hash IS NOT NULL
  ),
  hash_count AS (
    SELECT COUNT(*) AS cnt FROM audit_hash_chain
  ),
  mismatched AS (
    SELECT COUNT(*) AS cnt
    FROM audit_logs al
    JOIN audit_hash_chain ahc ON ahc.audit_log_id = al.id
    WHERE al.integrity_hash != ahc.integrity_hash
      AND (p_company_id IS NULL OR al.company_id = p_company_id)
  ),
  missing AS (
    SELECT COUNT(*) AS cnt
    FROM audit_logs al
    LEFT JOIN audit_hash_chain ahc ON ahc.audit_log_id = al.id
    WHERE ahc.id IS NULL
      AND al.integrity_hash IS NOT NULL
      AND (p_company_id IS NULL OR al.company_id = p_company_id)
  )
  SELECT
    (m.cnt = 0 AND mi.cnt = 0) AS is_valid,
    l.cnt AS total_logs,
    h.cnt AS total_hashes,
    m.cnt AS mismatches,
    mi.cnt AS missing_hashes
  FROM log_count l, hash_count h, mismatched m, missing mi;
END;
$$;
