
-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  price_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  max_users INTEGER NOT NULL DEFAULT 5,
  max_invoices INTEGER DEFAULT NULL,
  max_storage_mb INTEGER NOT NULL DEFAULT 500,
  features JSONB DEFAULT '[]'::jsonb,
  feature_flags JSONB DEFAULT '{}'::jsonb,
  module_limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_days INTEGER DEFAULT 14,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhance subscriptions
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS trial_end_date DATE,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS mrr NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  invoice_number TEXT,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) DEFAULT 0,
  gateway_fee NUMERIC(12,2) DEFAULT 0,
  billing_period_start DATE,
  billing_period_end DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'customer',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System activity logs
CREATE TABLE IF NOT EXISTS public.system_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to companies
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'SA',
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS employee_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS database_size_mb NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS api_calls_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function for super admin check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND permission = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Plans policies
CREATE POLICY "Plans readable by authenticated" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Plans manageable by super_admin" ON public.plans FOR ALL USING (public.is_super_admin());

-- Payments policies
CREATE POLICY "Payments viewable by company or admin" ON public.payments FOR SELECT TO authenticated USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  OR public.is_super_admin()
);
CREATE POLICY "Payments manageable by super_admin" ON public.payments FOR ALL USING (public.is_super_admin());

-- Ticket messages policies
CREATE POLICY "Messages viewable by ticket participants" ON public.support_ticket_messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t 
    WHERE t.id = ticket_id AND (
      t.company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
      OR public.is_super_admin()
    )
  )
);
CREATE POLICY "Messages creatable by authenticated" ON public.support_ticket_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- System logs policies  
CREATE POLICY "System logs super_admin only" ON public.system_activity_logs FOR ALL TO authenticated USING (public.is_super_admin());

-- Triggers
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_company ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_system_activity_created ON public.system_activity_logs(created_at DESC);
