
-- Add company_id to tamper_scan_runs (security audit data needs tenant isolation)
ALTER TABLE public.tamper_scan_runs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- tenant_network_config and tenant_storage_config already have tenant_id which references companies
-- Just add RLS policies to enforce isolation

-- tamper_scan_runs RLS
ALTER TABLE public.tamper_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company tamper scans"
  ON public.tamper_scan_runs FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- tenant_network_config RLS (uses tenant_id = company_id)
ALTER TABLE public.tenant_network_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant network config"
  ON public.tenant_network_config FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own tenant network config"
  ON public.tenant_network_config FOR ALL TO authenticated
  USING (tenant_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- tenant_storage_config RLS
ALTER TABLE public.tenant_storage_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant storage config"
  ON public.tenant_storage_config FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own tenant storage config"
  ON public.tenant_storage_config FOR ALL TO authenticated
  USING (tenant_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
