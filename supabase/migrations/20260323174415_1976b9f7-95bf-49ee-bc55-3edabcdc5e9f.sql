-- Ensure security events audit table exists for tenant provisioning logs
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id uuid NULL,
  source_schema text NULL,
  target_schema text NULL,
  table_name text NULL,
  operation text NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill missing columns safely if table existed with older structure
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS severity text;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS source_schema text;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS target_schema text;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS operation text;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS details jsonb;
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.security_events
  ALTER COLUMN event_type SET NOT NULL,
  ALTER COLUMN severity SET DEFAULT 'info',
  ALTER COLUMN severity SET NOT NULL,
  ALTER COLUMN details SET DEFAULT '{}'::jsonb,
  ALTER COLUMN details SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

-- Add FK only if absent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'security_events_company_id_fkey'
      AND conrelid = 'public.security_events'::regclass
  ) THEN
    ALTER TABLE public.security_events
      ADD CONSTRAINT security_events_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_company_id ON public.security_events(company_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view security events" ON public.security_events;
CREATE POLICY "Super admins can view security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Harden log function so auditing issues never block signup/user creation
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text,
  p_company_id uuid DEFAULT NULL::uuid,
  p_user_id uuid DEFAULT NULL::uuid,
  p_source_schema text DEFAULT NULL::text,
  p_target_schema text DEFAULT NULL::text,
  p_table_name text DEFAULT NULL::text,
  p_operation text DEFAULT NULL::text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_id uuid;
BEGIN
  BEGIN
    INSERT INTO public.security_events (
      event_type,
      severity,
      company_id,
      user_id,
      source_schema,
      target_schema,
      table_name,
      operation,
      details
    )
    VALUES (
      p_event_type,
      p_severity,
      p_company_id,
      COALESCE(p_user_id, auth.uid()),
      p_source_schema,
      p_target_schema,
      p_table_name,
      p_operation,
      COALESCE(p_details, '{}'::jsonb)
    )
    RETURNING id INTO event_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'log_security_event insert failed: %', SQLERRM;
    RETURN gen_random_uuid();
  END;

  IF p_severity IN ('critical', 'emergency') THEN
    BEGIN
      INSERT INTO public.notifications (company_id, title, message, type, is_read)
      SELECT p.company_id,
             '🚨 تنبيه أمني: ' || p_event_type,
             'تم اكتشاف ' || p_event_type || ' على ' || COALESCE(p_table_name, 'unknown'),
             'security_alert',
             false
      FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE ur.permission = 'super_admin'
      LIMIT 5;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'log_security_event notifications failed: %', SQLERRM;
    END;
  END IF;

  RETURN event_id;
END;
$function$;