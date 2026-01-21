-- Create table to store imported invoice templates data
CREATE TABLE public.imported_invoice_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  file_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imported_invoice_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company imported data"
  ON public.imported_invoice_data
  FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their company imported data"
  ON public.imported_invoice_data
  FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their company imported data"
  ON public.imported_invoice_data
  FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their company imported data"
  ON public.imported_invoice_data
  FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Add index for faster queries
CREATE INDEX idx_imported_invoice_data_company_id ON public.imported_invoice_data(company_id);