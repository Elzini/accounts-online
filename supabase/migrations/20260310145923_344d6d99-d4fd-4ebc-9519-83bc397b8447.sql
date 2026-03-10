
-- Field-Level Security: permissions per role per table per field
CREATE TABLE public.field_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_edit BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, role_name, table_name, field_name)
);

ALTER TABLE public.field_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "field_permissions_company_isolation" ON public.field_permissions
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- E-commerce integration settings
CREATE TABLE public.ecommerce_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'salla' or 'zid'
  store_url TEXT,
  api_key_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  sync_products BOOLEAN DEFAULT true,
  sync_orders BOOLEAN DEFAULT true,
  sync_customers BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, platform)
);

ALTER TABLE public.ecommerce_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ecommerce_integrations_company_isolation" ON public.ecommerce_integrations
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
