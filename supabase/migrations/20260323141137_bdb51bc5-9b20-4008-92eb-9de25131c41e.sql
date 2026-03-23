
-- ============================================
-- Add company_id to Critical Orphan Tables
-- Fixes: Multi-tenant isolation gaps (Audit Finding H1)
-- ============================================

-- 1. approval_actions: Needs company_id from parent approval_requests
ALTER TABLE public.approval_actions 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE OR REPLACE FUNCTION public.trg_approval_actions_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.approval_requests
    WHERE id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_approval_actions_company_id ON public.approval_actions;
CREATE TRIGGER trg_auto_approval_actions_company_id
  BEFORE INSERT ON public.approval_actions
  FOR EACH ROW EXECUTE FUNCTION public.trg_approval_actions_company_id();

-- 2. approval_steps: Needs company_id from parent approval_workflows
ALTER TABLE public.approval_steps 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE OR REPLACE FUNCTION public.trg_approval_steps_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.approval_workflows
    WHERE id = NEW.workflow_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_approval_steps_company_id ON public.approval_steps;
CREATE TRIGGER trg_auto_approval_steps_company_id
  BEFORE INSERT ON public.approval_steps
  FOR EACH ROW EXECUTE FUNCTION public.trg_approval_steps_company_id();

-- 3. bom_lines: Needs company_id from parent manufacturing_products
ALTER TABLE public.bom_lines 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE OR REPLACE FUNCTION public.trg_bom_lines_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.manufacturing_products
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_bom_lines_company_id ON public.bom_lines;
CREATE TRIGGER trg_auto_bom_lines_company_id
  BEFORE INSERT ON public.bom_lines
  FOR EACH ROW EXECUTE FUNCTION public.trg_bom_lines_company_id();

-- 4. chat_messages: Needs company_id from parent chat_channels
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE OR REPLACE FUNCTION public.trg_chat_messages_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.chat_channels
    WHERE id = NEW.channel_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_chat_messages_company_id ON public.chat_messages;
CREATE TRIGGER trg_auto_chat_messages_company_id
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.trg_chat_messages_company_id();

-- 5. crm_activities: Needs company_id (from associated lead/contact)
ALTER TABLE public.crm_activities 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 6. shipment_items: Needs company_id from parent shipments
ALTER TABLE public.shipment_items 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 7. survey_questions: Needs company_id from parent surveys
ALTER TABLE public.survey_questions 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 8. trip_passengers: Needs company_id from parent trips
ALTER TABLE public.trip_passengers 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE OR REPLACE FUNCTION public.trg_trip_passengers_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.trips
    WHERE id = NEW.trip_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_trip_passengers_company_id ON public.trip_passengers;
CREATE TRIGGER trg_auto_trip_passengers_company_id
  BEFORE INSERT ON public.trip_passengers
  FOR EACH ROW EXECUTE FUNCTION public.trg_trip_passengers_company_id();

-- 9. ticket_replies: Needs company_id from parent support_tickets
ALTER TABLE public.ticket_replies 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 10. support_ticket_messages: Needs company_id from parent support_tickets
ALTER TABLE public.support_ticket_messages 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 11. production_stages: Needs company_id from parent production_orders
ALTER TABLE public.production_stages 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Backfill existing data for approval_actions
UPDATE public.approval_actions aa
SET company_id = ar.company_id
FROM public.approval_requests ar
WHERE aa.request_id = ar.id AND aa.company_id IS NULL;

-- Backfill existing data for approval_steps
UPDATE public.approval_steps ast
SET company_id = aw.company_id
FROM public.approval_workflows aw
WHERE ast.workflow_id = aw.id AND ast.company_id IS NULL;

-- Backfill existing data for chat_messages
UPDATE public.chat_messages cm
SET company_id = cc.company_id
FROM public.chat_channels cc
WHERE cm.channel_id = cc.id AND cm.company_id IS NULL;

-- Add indexes on the new company_id columns
CREATE INDEX IF NOT EXISTS idx_approval_actions_company ON public.approval_actions(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_company ON public.approval_steps(company_id);
CREATE INDEX IF NOT EXISTS idx_bom_lines_company ON public.bom_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_company ON public.chat_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_company ON public.crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_company ON public.shipment_items(company_id);
CREATE INDEX IF NOT EXISTS idx_trip_passengers_company ON public.trip_passengers(company_id);
