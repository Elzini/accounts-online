
-- API Keys table for public API access
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions TEXT[] DEFAULT ARRAY['read', 'write'],
  rate_limit INTEGER DEFAULT 1000,
  request_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can manage their own company's API keys
CREATE POLICY "Users can view their company API keys"
  ON public.api_keys FOR SELECT
  USING (company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create API keys for their company"
  ON public.api_keys FOR INSERT
  WITH CHECK (company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their company API keys"
  ON public.api_keys FOR UPDATE
  USING (company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their company API keys"
  ON public.api_keys FOR DELETE
  USING (company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  ));
