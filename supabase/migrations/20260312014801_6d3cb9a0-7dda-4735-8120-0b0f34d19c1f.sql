
-- Recurring Invoices table
CREATE TABLE public.recurring_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  invoice_type TEXT NOT NULL DEFAULT 'sale',
  template_data JSONB NOT NULL DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  last_generated_at TIMESTAMPTZ,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_approve BOOLEAN NOT NULL DEFAULT false,
  generated_count INTEGER NOT NULL DEFAULT 0,
  max_occurrences INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collection Reminders table
CREATE TABLE public.collection_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  invoice_id UUID,
  reminder_type TEXT NOT NULL DEFAULT 'overdue',
  days_offset INTEGER NOT NULL DEFAULT 0,
  amount_due NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  response_note TEXT,
  reminder_method TEXT NOT NULL DEFAULT 'notification',
  escalation_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collection reminder rules (templates)
CREATE TABLE public.collection_reminder_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reminder_type TEXT NOT NULL DEFAULT 'overdue',
  days_offset INTEGER NOT NULL DEFAULT 0,
  reminder_method TEXT NOT NULL DEFAULT 'notification',
  escalation_level INTEGER NOT NULL DEFAULT 1,
  message_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_reminder_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "recurring_invoices_select" ON public.recurring_invoices FOR SELECT TO authenticated USING (strict_company_check(company_id));
CREATE POLICY "recurring_invoices_insert" ON public.recurring_invoices FOR INSERT TO authenticated WITH CHECK (strict_company_check(company_id));
CREATE POLICY "recurring_invoices_update" ON public.recurring_invoices FOR UPDATE TO authenticated USING (strict_company_check(company_id));
CREATE POLICY "recurring_invoices_delete" ON public.recurring_invoices FOR DELETE TO authenticated USING (strict_company_check(company_id));

CREATE POLICY "collection_reminders_select" ON public.collection_reminders FOR SELECT TO authenticated USING (strict_company_check(company_id));
CREATE POLICY "collection_reminders_insert" ON public.collection_reminders FOR INSERT TO authenticated WITH CHECK (strict_company_check(company_id));
CREATE POLICY "collection_reminders_update" ON public.collection_reminders FOR UPDATE TO authenticated USING (strict_company_check(company_id));
CREATE POLICY "collection_reminders_delete" ON public.collection_reminders FOR DELETE TO authenticated USING (strict_company_check(company_id));

CREATE POLICY "collection_reminder_rules_select" ON public.collection_reminder_rules FOR SELECT TO authenticated USING (strict_company_check(company_id));
CREATE POLICY "collection_reminder_rules_insert" ON public.collection_reminder_rules FOR INSERT TO authenticated WITH CHECK (strict_company_check(company_id));
CREATE POLICY "collection_reminder_rules_update" ON public.collection_reminder_rules FOR UPDATE TO authenticated USING (strict_company_check(company_id));
CREATE POLICY "collection_reminder_rules_delete" ON public.collection_reminder_rules FOR DELETE TO authenticated USING (strict_company_check(company_id));
