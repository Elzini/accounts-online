
-- Add project_id to invoices table
ALTER TABLE public.invoices 
ADD COLUMN project_id uuid REFERENCES public.re_projects(id) ON DELETE SET NULL;

-- Add project_id to journal_entries table  
ALTER TABLE public.journal_entries 
ADD COLUMN project_id uuid REFERENCES public.re_projects(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_journal_entries_project_id ON public.journal_entries(project_id) WHERE project_id IS NOT NULL;
