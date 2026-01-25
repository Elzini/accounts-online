-- Create table to store imported trial balance data
CREATE TABLE public.trial_balance_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  period_from DATE,
  period_to DATE,
  vat_number VARCHAR(20),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trial_balance_imports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company trial balance imports"
ON public.trial_balance_imports FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert trial balance imports for their company"
ON public.trial_balance_imports FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company trial balance imports"
ON public.trial_balance_imports FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company trial balance imports"
ON public.trial_balance_imports FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);