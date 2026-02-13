
-- =============================================
-- 1. ENCRYPTION KEY ROTATION SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS public.encryption_key_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key_version INTEGER NOT NULL DEFAULT 1,
  key_hash TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'retired', 'compromised')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  rotation_reason TEXT,
  UNIQUE(company_id, key_version)
);

ALTER TABLE public.encryption_key_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view encryption keys"
  ON public.encryption_key_registry FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company members can manage encryption keys"
  ON public.encryption_key_registry FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.rotate_tenant_encryption_key(
  p_company_id UUID,
  p_reason TEXT DEFAULT 'scheduled_rotation'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_version INTEGER;
  v_new_version INTEGER;
  v_new_key_hash TEXT;
BEGIN
  SELECT COALESCE(MAX(key_version), 0) INTO v_current_version
  FROM encryption_key_registry
  WHERE company_id = p_company_id AND status = 'active';

  v_new_version := v_current_version + 1;
  v_new_key_hash := encode(digest(gen_random_uuid()::text || now()::text || p_company_id::text, 'sha256'), 'hex');

  UPDATE encryption_key_registry
  SET status = 'rotating', rotated_at = now()
  WHERE company_id = p_company_id AND status = 'active';

  INSERT INTO encryption_key_registry (company_id, key_version, key_hash, status, created_by, rotation_reason)
  VALUES (p_company_id, v_new_version, v_new_key_hash, 'active', auth.uid(), p_reason);

  UPDATE encryption_key_registry
  SET status = 'retired'
  WHERE company_id = p_company_id AND status = 'rotating';

  INSERT INTO security_audit_trail (tenant_id, event_type, severity, event_data, ip_address)
  VALUES (p_company_id, 'key_rotation', 'info', 
    jsonb_build_object('old_version', v_current_version, 'new_version', v_new_version, 'reason', p_reason),
    '0.0.0.0');

  RETURN jsonb_build_object(
    'success', true,
    'old_version', v_current_version,
    'new_version', v_new_version,
    'rotated_at', now()
  );
END;
$$;

-- =============================================
-- 2. ANOMALY DETECTION SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS public.security_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  detection_source TEXT NOT NULL DEFAULT 'system',
  event_data JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view anomalies"
  ON public.security_anomalies FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company members can update anomalies"
  ON public.security_anomalies FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.detect_security_anomalies(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anomalies JSONB := '[]'::jsonb;
  v_recent_count INTEGER;
BEGIN
  -- 1. Excessive logins (>10 in last hour)
  SELECT COUNT(*) INTO v_recent_count
  FROM audit_logs WHERE company_id = p_company_id AND action = 'user_login' AND created_at > now() - interval '1 hour';
  IF v_recent_count > 10 THEN
    INSERT INTO security_anomalies (company_id, anomaly_type, severity, description, event_data)
    VALUES (p_company_id, 'excessive_logins', 'high', 'عدد غير طبيعي من عمليات تسجيل الدخول',
      jsonb_build_object('count', v_recent_count, 'window', '1 hour'));
    v_anomalies := v_anomalies || jsonb_build_object('type', 'excessive_logins', 'count', v_recent_count);
  END IF;

  -- 2. Bulk deletion (>50 in 30 min)
  SELECT COUNT(*) INTO v_recent_count
  FROM audit_logs WHERE company_id = p_company_id AND action LIKE '%delete%' AND created_at > now() - interval '30 minutes';
  IF v_recent_count > 50 THEN
    INSERT INTO security_anomalies (company_id, anomaly_type, severity, description, event_data)
    VALUES (p_company_id, 'bulk_deletion', 'critical', 'حذف جماعي للبيانات',
      jsonb_build_object('deletions', v_recent_count, 'window', '30 minutes'));
    v_anomalies := v_anomalies || jsonb_build_object('type', 'bulk_deletion', 'count', v_recent_count);
  END IF;

  -- 3. Brute force (>20 blocked IPs in hour)
  SELECT COUNT(*) INTO v_recent_count
  FROM audit_logs WHERE company_id = p_company_id AND action = 'blocked_ip_access' AND created_at > now() - interval '1 hour';
  IF v_recent_count > 20 THEN
    INSERT INTO security_anomalies (company_id, anomaly_type, severity, description, event_data)
    VALUES (p_company_id, 'brute_force_attempt', 'critical', 'محاولة اختراق عبر عناوين IP محظورة',
      jsonb_build_object('blocked_attempts', v_recent_count, 'window', '1 hour'));
    v_anomalies := v_anomalies || jsonb_build_object('type', 'brute_force', 'count', v_recent_count);
  END IF;

  -- 4. After-hours access
  SELECT COUNT(*) INTO v_recent_count
  FROM audit_logs WHERE company_id = p_company_id AND action = 'user_login'
    AND created_at > now() - interval '24 hours' AND EXTRACT(HOUR FROM created_at) NOT BETWEEN 6 AND 23;
  IF v_recent_count > 5 THEN
    INSERT INTO security_anomalies (company_id, anomaly_type, severity, description, event_data)
    VALUES (p_company_id, 'after_hours_access', 'medium', 'عمليات دخول خارج أوقات العمل',
      jsonb_build_object('count', v_recent_count, 'window', '24 hours'));
    v_anomalies := v_anomalies || jsonb_build_object('type', 'after_hours', 'count', v_recent_count);
  END IF;

  -- 5. Privilege escalation
  SELECT COUNT(*) INTO v_recent_count
  FROM audit_logs WHERE company_id = p_company_id
    AND (action LIKE '%role_change%' OR action LIKE '%permission%') AND created_at > now() - interval '1 hour';
  IF v_recent_count > 5 THEN
    INSERT INTO security_anomalies (company_id, anomaly_type, severity, description, event_data)
    VALUES (p_company_id, 'privilege_escalation', 'critical', 'محاولات تصعيد صلاحيات',
      jsonb_build_object('changes', v_recent_count, 'window', '1 hour'));
    v_anomalies := v_anomalies || jsonb_build_object('type', 'privilege_escalation', 'count', v_recent_count);
  END IF;

  RETURN jsonb_build_object('anomalies_found', jsonb_array_length(v_anomalies), 'details', v_anomalies, 'scanned_at', now());
END;
$$;

-- =============================================
-- 3. ENCRYPTED BACKUP METADATA
-- =============================================

ALTER TABLE public.backups
  ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS encryption_key_version INTEGER,
  ADD COLUMN IF NOT EXISTS encryption_algorithm TEXT DEFAULT 'aes-256-gcm',
  ADD COLUMN IF NOT EXISTS checksum TEXT,
  ADD COLUMN IF NOT EXISTS restore_tested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS restore_test_status TEXT;

-- =============================================
-- 4. RATE LIMIT CONFIG PER ENDPOINT
-- =============================================

CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  max_requests INTEGER NOT NULL DEFAULT 100,
  window_seconds INTEGER NOT NULL DEFAULT 60,
  block_duration_seconds INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, endpoint)
);

ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view rate limits"
  ON public.rate_limit_config FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company members can manage rate limits"
  ON public.rate_limit_config FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================
-- 5. SECURITY ALERTS (REAL-TIME)
-- =============================================

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  triggered_by TEXT,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view alerts"
  ON public.security_alerts FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company members can update alerts"
  ON public.security_alerts FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Auto-create alert on critical anomaly
CREATE OR REPLACE FUNCTION public.auto_alert_on_anomaly()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.severity IN ('high', 'critical') THEN
    INSERT INTO security_alerts (company_id, alert_type, severity, title, message, triggered_by, event_data)
    VALUES (NEW.company_id, NEW.anomaly_type, NEW.severity, 'تنبيه أمني: ' || NEW.anomaly_type, NEW.description, 'anomaly_detection', NEW.event_data);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_alert_on_anomaly
  AFTER INSERT ON public.security_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_alert_on_anomaly();

-- Enable realtime for security alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;
