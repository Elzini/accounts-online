-- Create backups table
CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  backup_type TEXT NOT NULL DEFAULT 'manual' CHECK (backup_type IN ('manual', 'automatic')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  file_path TEXT,
  file_size BIGINT,
  tables_included TEXT[] NOT NULL DEFAULT ARRAY['customers', 'suppliers', 'cars', 'sales', 'purchase_batches', 'journal_entries'],
  records_count JSONB DEFAULT '{}'::jsonb,
  backup_data JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company backups"
  ON public.backups
  FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create backups for their company"
  ON public.backups
  FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their company backups"
  ON public.backups
  FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their company backups"
  ON public.backups
  FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Create backup_schedules table for automatic backups
CREATE TABLE public.backup_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  last_backup_at TIMESTAMP WITH TIME ZONE,
  next_backup_at TIMESTAMP WITH TIME ZONE,
  retention_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company backup schedule"
  ON public.backup_schedules
  FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their company backup schedule"
  ON public.backup_schedules
  FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Create index
CREATE INDEX idx_backups_company_id ON public.backups(company_id);
CREATE INDEX idx_backups_created_at ON public.backups(created_at DESC);
CREATE INDEX idx_backup_schedules_next_backup ON public.backup_schedules(next_backup_at) WHERE is_enabled = true;