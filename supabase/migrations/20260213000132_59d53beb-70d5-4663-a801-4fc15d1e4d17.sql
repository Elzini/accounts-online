
-- =====================================================
-- IP Whitelisting + Network Segmentation لكل Tenant
-- =====================================================

-- 1) جدول IP Whitelist
CREATE TABLE IF NOT EXISTS public.tenant_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  cidr_range text,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, ip_address)
);

ALTER TABLE public.tenant_ip_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage IP whitelist"
  ON public.tenant_ip_whitelist FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission IN ('super_admin', 'admin'))
  );

CREATE INDEX idx_ip_whitelist_tenant ON public.tenant_ip_whitelist(tenant_id);
CREATE INDEX idx_ip_whitelist_ip ON public.tenant_ip_whitelist(ip_address);

-- 2) Network Access Log
CREATE TABLE IF NOT EXISTS public.network_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  ip_address text NOT NULL,
  user_agent text,
  request_path text,
  request_method text,
  allowed boolean NOT NULL,
  block_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.network_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view network logs"
  ON public.network_access_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission = 'super_admin'));

CREATE POLICY "System inserts network logs"
  ON public.network_access_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR current_user = 'postgres' OR current_user LIKE 'supabase%');

CREATE INDEX idx_network_log_tenant ON public.network_access_log(tenant_id);
CREATE INDEX idx_network_log_created ON public.network_access_log(created_at DESC);
CREATE INDEX idx_network_log_blocked ON public.network_access_log(allowed) WHERE allowed = false;

-- 3) إعدادات الشبكة لكل tenant
CREATE TABLE IF NOT EXISTS public.tenant_network_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  ip_whitelist_enabled boolean DEFAULT false,
  max_requests_per_ip_per_minute int DEFAULT 60,
  block_foreign_ips boolean DEFAULT false,
  allowed_countries text[] DEFAULT '{}',
  vpn_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_network_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage network config"
  ON public.tenant_network_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND permission IN ('super_admin', 'admin'))
  );

-- 4) دالة التحقق من IP
CREATE OR REPLACE FUNCTION public.check_tenant_ip_access(
  p_tenant_id uuid,
  p_ip_address text,
  p_request_path text DEFAULT NULL,
  p_request_method text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_config record;
  v_allowed boolean := true;
  v_reason text := NULL;
  v_whitelist_count int;
BEGIN
  SELECT * INTO v_config FROM tenant_network_config WHERE tenant_id = p_tenant_id;

  IF v_config IS NULL OR NOT v_config.ip_whitelist_enabled THEN
    INSERT INTO network_access_log (tenant_id, ip_address, user_agent, request_path, request_method, allowed)
    VALUES (p_tenant_id, p_ip_address, p_user_agent, p_request_path, p_request_method, true);
    RETURN jsonb_build_object('allowed', true);
  END IF;

  -- فحص IP مباشر
  SELECT count(*) INTO v_whitelist_count
  FROM tenant_ip_whitelist
  WHERE tenant_id = p_tenant_id AND is_active = true AND ip_address = p_ip_address;

  IF v_whitelist_count = 0 THEN
    -- فحص CIDR
    SELECT count(*) INTO v_whitelist_count
    FROM tenant_ip_whitelist
    WHERE tenant_id = p_tenant_id AND is_active = true 
      AND cidr_range IS NOT NULL 
      AND p_ip_address::inet <<= cidr_range::cidr;

    IF v_whitelist_count = 0 THEN
      v_allowed := false;
      v_reason := 'IP not in whitelist: ' || p_ip_address;
    END IF;
  END IF;

  INSERT INTO network_access_log (tenant_id, ip_address, user_agent, request_path, request_method, allowed, block_reason)
  VALUES (p_tenant_id, p_ip_address, p_user_agent, p_request_path, p_request_method, v_allowed, v_reason);

  IF NOT v_allowed THEN
    INSERT INTO security_audit_trail (event_type, severity, tenant_id, details, blocked)
    VALUES ('ip_access_blocked', 'warning', p_tenant_id,
      jsonb_build_object('ip', p_ip_address, 'path', p_request_path, 'reason', v_reason), true);
  END IF;

  RETURN jsonb_build_object('allowed', v_allowed, 'reason', v_reason);
END;
$$;

-- 5) Auto-create network config
CREATE OR REPLACE FUNCTION public.auto_create_network_config()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO tenant_network_config (tenant_id) VALUES (NEW.id)
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_network_config ON public.companies;
CREATE TRIGGER trg_auto_network_config
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION auto_create_network_config();

-- 6) تطبيق على الشركات الحالية
INSERT INTO tenant_network_config (tenant_id)
SELECT id FROM companies
ON CONFLICT (tenant_id) DO NOTHING;
