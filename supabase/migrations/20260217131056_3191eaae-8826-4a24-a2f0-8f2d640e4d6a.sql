
CREATE TABLE public.sms_provider_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  sender_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, provider)
);

ALTER TABLE public.sms_provider_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sms configs for their company"
ON public.sms_provider_configs FOR SELECT
USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert sms configs for their company"
ON public.sms_provider_configs FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update sms configs for their company"
ON public.sms_provider_configs FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete sms configs for their company"
ON public.sms_provider_configs FOR DELETE
USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));
