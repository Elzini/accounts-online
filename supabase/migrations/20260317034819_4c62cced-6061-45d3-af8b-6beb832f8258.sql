
CREATE TABLE public.system_change_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type text NOT NULL,
  affected_module text NOT NULL,
  description text NOT NULL,
  request_source text NOT NULL DEFAULT 'system',
  previous_value jsonb,
  new_value jsonb,
  affected_tables text[],
  impact_analysis jsonb,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_change_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_select_system_change_alerts"
  ON public.system_change_alerts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

CREATE POLICY "super_admins_insert_system_change_alerts"
  ON public.system_change_alerts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "super_admins_update_system_change_alerts"
  ON public.system_change_alerts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_change_alerts;
