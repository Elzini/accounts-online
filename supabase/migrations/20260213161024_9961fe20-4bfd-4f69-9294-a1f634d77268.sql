
-- ============================================
-- Document Cycle / Workflow Engine Schema
-- ============================================

-- 1. Workflow Templates
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  icon TEXT DEFAULT 'FileText',
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Workflow Stages
CREATE TABLE public.workflow_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  stage_order INTEGER NOT NULL DEFAULT 0,
  stage_type TEXT NOT NULL DEFAULT 'task',
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'Circle',
  requires_approval BOOLEAN DEFAULT false,
  approval_roles TEXT[],
  auto_advance BOOLEAN DEFAULT false,
  time_limit_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Custom Fields per Stage
CREATE TABLE public.workflow_stage_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.workflow_stages(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_label_en TEXT,
  field_type TEXT NOT NULL DEFAULT 'text',
  field_options JSONB,
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  field_order INTEGER NOT NULL DEFAULT 0,
  validation_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Accounting Rules per Stage
CREATE TABLE public.workflow_accounting_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.workflow_stages(id) ON DELETE CASCADE,
  trigger_on TEXT NOT NULL DEFAULT 'enter',
  description TEXT,
  debit_account_id UUID,
  credit_account_id UUID,
  amount_source TEXT DEFAULT 'field',
  amount_field_name TEXT,
  amount_fixed NUMERIC,
  amount_formula TEXT,
  cost_center_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Stage Transitions
CREATE TABLE public.workflow_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES public.workflow_stages(id) ON DELETE CASCADE,
  to_stage_id UUID NOT NULL REFERENCES public.workflow_stages(id) ON DELETE CASCADE,
  condition_type TEXT DEFAULT 'always',
  condition_config JSONB,
  label TEXT,
  label_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Workflow Instances
CREATE TABLE public.workflow_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_templates(id),
  company_id UUID NOT NULL,
  reference_number TEXT,
  title TEXT NOT NULL,
  current_stage_id UUID REFERENCES public.workflow_stages(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_by UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Instance Stage Data
CREATE TABLE public.workflow_instance_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.workflow_stages(id),
  stage_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  entered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  approval_status TEXT,
  approval_by UUID,
  approval_at TIMESTAMPTZ,
  approval_notes TEXT,
  journal_entry_ids UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate reference numbers
CREATE OR REPLACE FUNCTION public.generate_workflow_ref_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(LEFT(wt.name_en, 3), LEFT(wt.name, 3), 'WF')
  INTO prefix
  FROM public.workflow_templates wt
  WHERE wt.id = NEW.workflow_id;
  
  SELECT COUNT(*) + 1
  INTO seq_num
  FROM public.workflow_instances
  WHERE workflow_id = NEW.workflow_id AND company_id = NEW.company_id;
  
  NEW.reference_number := UPPER(prefix) || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_workflow_ref_number
BEFORE INSERT ON public.workflow_instances
FOR EACH ROW
WHEN (NEW.reference_number IS NULL)
EXECUTE FUNCTION public.generate_workflow_ref_number();

-- Updated_at triggers
CREATE TRIGGER update_workflow_templates_updated_at
BEFORE UPDATE ON public.workflow_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_instances_updated_at
BEFORE UPDATE ON public.workflow_instances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stage_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_accounting_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instance_stages ENABLE ROW LEVEL SECURITY;

-- RLS: company-scoped access via profiles table
CREATE POLICY "Company users manage workflow templates"
ON public.workflow_templates FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = workflow_templates.company_id)
);

CREATE POLICY "Access workflow stages via template"
ON public.workflow_stages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workflow_templates wt
    JOIN public.profiles p ON p.company_id = wt.company_id
    WHERE wt.id = workflow_stages.workflow_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Access stage fields via stage"
ON public.workflow_stage_fields FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workflow_stages ws
    JOIN public.workflow_templates wt ON wt.id = ws.workflow_id
    JOIN public.profiles p ON p.company_id = wt.company_id
    WHERE ws.id = workflow_stage_fields.stage_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Access accounting rules via stage"
ON public.workflow_accounting_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workflow_stages ws
    JOIN public.workflow_templates wt ON wt.id = ws.workflow_id
    JOIN public.profiles p ON p.company_id = wt.company_id
    WHERE ws.id = workflow_accounting_rules.stage_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Access transitions via template"
ON public.workflow_transitions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workflow_templates wt
    JOIN public.profiles p ON p.company_id = wt.company_id
    WHERE wt.id = workflow_transitions.workflow_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users access workflow instances"
ON public.workflow_instances FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id = workflow_instances.company_id)
);

CREATE POLICY "Access instance stages via instance"
ON public.workflow_instance_stages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workflow_instances wi
    JOIN public.profiles p ON p.company_id = wi.company_id
    WHERE wi.id = workflow_instance_stages.instance_id AND p.user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_wf_stages_workflow ON public.workflow_stages(workflow_id);
CREATE INDEX idx_wf_fields_stage ON public.workflow_stage_fields(stage_id);
CREATE INDEX idx_wf_rules_stage ON public.workflow_accounting_rules(stage_id);
CREATE INDEX idx_wf_transitions_workflow ON public.workflow_transitions(workflow_id);
CREATE INDEX idx_wf_instances_workflow ON public.workflow_instances(workflow_id);
CREATE INDEX idx_wf_instances_company ON public.workflow_instances(company_id);
CREATE INDEX idx_wf_instances_status ON public.workflow_instances(status);
CREATE INDEX idx_wf_inst_stages_instance ON public.workflow_instance_stages(instance_id);
