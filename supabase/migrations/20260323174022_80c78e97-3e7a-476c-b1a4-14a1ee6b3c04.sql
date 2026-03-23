-- Create missing tenant_network_config table
CREATE TABLE IF NOT EXISTS public.tenant_network_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  allowed_ips text[],
  blocked_ips text[],
  rate_limit_per_minute integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_network_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access tenant network config" ON public.tenant_network_config FOR SELECT TO authenticated USING (false);

-- Fix auto_create_network_config to have exception handler
CREATE OR REPLACE FUNCTION public.auto_create_network_config()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO tenant_network_config (tenant_id) VALUES (NEW.id)
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Network config creation failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix auto_create_tenant_schema to have exception handler
CREATE OR REPLACE FUNCTION public.auto_create_tenant_schema()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM create_tenant_schema(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Tenant schema creation failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix auto_provision_storage to have exception handler
CREATE OR REPLACE FUNCTION public.auto_provision_storage()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM provision_tenant_storage(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Storage provisioning failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix initialize_default_asset_categories to have exception handler
CREATE OR REPLACE FUNCTION public.initialize_default_asset_categories()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.asset_categories (company_id, name, default_useful_life, default_depreciation_method, description)
  VALUES 
    (NEW.id, 'مباني وإنشاءات', 25, 'straight_line', 'المباني والإنشاءات'),
    (NEW.id, 'آلات ومعدات', 10, 'straight_line', 'الآلات والمعدات الصناعية'),
    (NEW.id, 'أثاث ومفروشات', 5, 'straight_line', 'الأثاث المكتبي والمفروشات'),
    (NEW.id, 'أجهزة حاسب آلي', 3, 'straight_line', 'أجهزة الكمبيوتر والتقنية'),
    (NEW.id, 'سيارات ومركبات', 5, 'straight_line', 'السيارات والمركبات'),
    (NEW.id, 'تجهيزات مكتبية', 5, 'straight_line', 'التجهيزات المكتبية');
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Asset categories init failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fix trigger_apply_default_settings to have exception handler
CREATE OR REPLACE FUNCTION public.trigger_apply_default_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM apply_default_settings_to_company(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Default settings apply failed: %', SQLERRM;
  RETURN NEW;
END;
$$;