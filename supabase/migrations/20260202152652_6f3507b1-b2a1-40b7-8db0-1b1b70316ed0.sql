-- Create contracts table for construction
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  contract_number SERIAL,
  contract_type VARCHAR(50) DEFAULT 'main' CHECK (contract_type IN ('main', 'subcontract', 'supply', 'service')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contractor_name VARCHAR(255),
  contractor_phone VARCHAR(50),
  contractor_address TEXT,
  contract_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  advance_payment NUMERIC(15, 2) DEFAULT 0,
  advance_percentage NUMERIC(5, 2) DEFAULT 0,
  retention_percentage NUMERIC(5, 2) DEFAULT 10,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended', 'completed', 'terminated')),
  payment_terms TEXT,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create progress billings (مستخلصات) table
CREATE TABLE IF NOT EXISTS public.progress_billings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  billing_number SERIAL,
  billing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE,
  period_end DATE,
  work_completed_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  previous_billings NUMERIC(15, 2) DEFAULT 0,
  retention_amount NUMERIC(15, 2) DEFAULT 0,
  advance_deduction NUMERIC(15, 2) DEFAULT 0,
  other_deductions NUMERIC(15, 2) DEFAULT 0,
  vat_amount NUMERIC(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  payment_date DATE,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_billings ENABLE ROW LEVEL SECURITY;

-- RLS policies for contracts
CREATE POLICY "Users can view contracts in their company" 
ON public.contracts FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert contracts in their company" 
ON public.contracts FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update contracts in their company" 
ON public.contracts FOR UPDATE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete contracts in their company" 
ON public.contracts FOR DELETE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for progress_billings
CREATE POLICY "Users can view progress_billings in their company" 
ON public.progress_billings FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert progress_billings in their company" 
ON public.progress_billings FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update progress_billings in their company" 
ON public.progress_billings FOR UPDATE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete progress_billings in their company" 
ON public.progress_billings FOR DELETE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contracts_company ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_billings_company ON public.progress_billings(company_id);
CREATE INDEX IF NOT EXISTS idx_progress_billings_project ON public.progress_billings(project_id);