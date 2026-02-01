-- Dashboard configuration table for customizing stat cards and analytics
CREATE TABLE IF NOT EXISTS public.dashboard_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stat_cards JSONB NOT NULL DEFAULT '[]',
  analytics_settings JSONB NOT NULL DEFAULT '{}',
  layout_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.dashboard_config ENABLE ROW LEVEL SECURITY;

-- Policies for dashboard_config
CREATE POLICY "Users can view their company dashboard config"
  ON public.dashboard_config
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage dashboard config"
  ON public.dashboard_config
  FOR ALL
  USING (
    company_id IN (
      SELECT p.company_id FROM public.profiles p
      INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid() AND ur.permission = 'admin'
    )
  );

-- Add index
CREATE INDEX idx_dashboard_config_company ON public.dashboard_config(company_id);