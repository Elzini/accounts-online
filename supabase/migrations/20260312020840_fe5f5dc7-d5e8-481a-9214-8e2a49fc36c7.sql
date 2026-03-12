
-- Fix supplier_portal_tokens: drop and recreate with UUID
DROP TABLE IF EXISTS public.supplier_portal_tokens CASCADE;
DROP TABLE IF EXISTS public.approval_delegations CASCADE;

CREATE TABLE public.supplier_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  supplier_name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supplier_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_portal_tokens_company" ON public.supplier_portal_tokens
  FOR ALL TO authenticated
  USING (public.strict_company_check(company_id))
  WITH CHECK (public.strict_company_check(company_id));

CREATE POLICY "supplier_portal_tokens_public_read" ON public.supplier_portal_tokens
  FOR SELECT TO anon
  USING (is_active = true);

CREATE TABLE public.approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  delegator_user_id UUID NOT NULL,
  delegate_user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_delegations_company" ON public.approval_delegations
  FOR ALL TO authenticated
  USING (public.strict_company_check(company_id))
  WITH CHECK (public.strict_company_check(company_id));
