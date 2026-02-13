
-- Customer Portal Access Tokens
CREATE TABLE public.customer_portal_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_tokens_select" ON public.customer_portal_tokens FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "portal_tokens_insert" ON public.customer_portal_tokens FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "portal_tokens_update" ON public.customer_portal_tokens FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "portal_tokens_delete" ON public.customer_portal_tokens FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE TRIGGER update_portal_tokens_updated_at
  BEFORE UPDATE ON public.customer_portal_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_portal_tokens_customer ON public.customer_portal_tokens(customer_id);
CREATE INDEX idx_portal_tokens_token ON public.customer_portal_tokens(token);
