
CREATE TABLE IF NOT EXISTS public.integrity_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  company_id text NOT NULL,
  hash_value text NOT NULL,
  fields_snapshot jsonb NOT NULL DEFAULT '{}',
  computed_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  is_valid boolean DEFAULT true,
  UNIQUE(table_name, record_id)
);

CREATE TABLE IF NOT EXISTS public.tamper_detection_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  company_id text,
  previous_hash text,
  current_hash text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL DEFAULT 'high',
  status text NOT NULL DEFAULT 'detected',
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_notes text,
  impact_analysis jsonb,
  fields_before jsonb,
  fields_after jsonb
);

CREATE TABLE IF NOT EXISTS public.tamper_scan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_records_checked integer DEFAULT 0,
  mismatches_found integer DEFAULT 0,
  new_records_hashed integer DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  scan_type text NOT NULL DEFAULT 'scheduled',
  triggered_by uuid,
  error_message text
);

ALTER TABLE public.integrity_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tamper_detection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tamper_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_read_integrity_hashes" ON public.integrity_hashes
  FOR SELECT TO authenticated USING (public.is_super_admin());

CREATE POLICY "sa_read_tamper_events" ON public.tamper_detection_events
  FOR SELECT TO authenticated USING (public.is_super_admin());

CREATE POLICY "sa_update_tamper_events" ON public.tamper_detection_events
  FOR UPDATE TO authenticated USING (public.is_super_admin());

CREATE POLICY "sa_read_scan_runs" ON public.tamper_scan_runs
  FOR SELECT TO authenticated USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_integrity_hashes_lookup ON public.integrity_hashes(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_integrity_hashes_co ON public.integrity_hashes(company_id);
CREATE INDEX IF NOT EXISTS idx_tamper_events_st ON public.tamper_detection_events(status);
CREATE INDEX IF NOT EXISTS idx_tamper_events_dt ON public.tamper_detection_events(detected_at DESC);
