
CREATE TABLE IF NOT EXISTS public.audit_hash_chain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid NOT NULL,
  integrity_hash text NOT NULL,
  previous_hash text,
  sequence_number bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_hash_chain_audit_log_id ON public.audit_hash_chain(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_audit_hash_chain_sequence ON public.audit_hash_chain(sequence_number DESC);

ALTER TABLE public.audit_hash_chain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_hash_chain"
  ON public.audit_hash_chain FOR SELECT
  TO authenticated
  USING (rbac_check('admin') OR rbac_check('super_admin'));

CREATE POLICY "deny_insert_hash_chain"
  ON public.audit_hash_chain FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "deny_update_hash_chain"
  ON public.audit_hash_chain FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "deny_delete_hash_chain"
  ON public.audit_hash_chain FOR DELETE
  TO authenticated
  USING (false);
