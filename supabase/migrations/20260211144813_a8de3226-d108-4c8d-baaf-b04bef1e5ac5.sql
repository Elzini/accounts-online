
-- Create cost_centers table
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.cost_centers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Enable RLS
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

-- RLS policies using strict_company_check
CREATE POLICY "cost_centers_select" ON public.cost_centers FOR SELECT USING (public.strict_company_check(company_id));
CREATE POLICY "cost_centers_insert" ON public.cost_centers FOR INSERT WITH CHECK (public.strict_company_check(company_id));
CREATE POLICY "cost_centers_update" ON public.cost_centers FOR UPDATE USING (public.strict_company_check(company_id));
CREATE POLICY "cost_centers_delete" ON public.cost_centers FOR DELETE USING (public.strict_company_check(company_id));

-- Add cost_center_id to journal_entry_lines
ALTER TABLE public.journal_entry_lines ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id);

-- Trigger for updated_at
CREATE TRIGGER update_cost_centers_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
