-- Create custodies table for managing custody/imprest funds
CREATE TABLE public.custodies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  employee_id UUID REFERENCES public.employees(id),
  custody_number SERIAL,
  custody_name TEXT NOT NULL,
  custody_amount NUMERIC NOT NULL DEFAULT 0,
  custody_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'partially_settled')),
  settlement_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custody_transactions table for tracking expenses against custody
CREATE TABLE public.custody_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custody_id UUID NOT NULL REFERENCES public.custodies(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  analysis_category TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  account_id UUID REFERENCES public.account_categories(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for custodies
CREATE POLICY "View custodies in company" ON public.custodies
FOR SELECT USING (
  is_super_admin(auth.uid())
  OR company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Insert custodies in company" ON public.custodies
FOR INSERT WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Update custodies in company" ON public.custodies
FOR UPDATE USING (
  is_super_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Delete custodies in company" ON public.custodies
FOR DELETE USING (
  is_super_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND is_admin(auth.uid())
  )
);

-- RLS policies for custody_transactions
CREATE POLICY "View custody transactions in company" ON public.custody_transactions
FOR SELECT USING (
  is_super_admin(auth.uid())
  OR company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Insert custody transactions in company" ON public.custody_transactions
FOR INSERT WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Update custody transactions in company" ON public.custody_transactions
FOR UPDATE USING (
  is_super_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Delete custody transactions in company" ON public.custody_transactions
FOR DELETE USING (
  is_super_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND is_admin(auth.uid())
  )
);

-- Add indexes for performance
CREATE INDEX idx_custodies_company_id ON public.custodies(company_id);
CREATE INDEX idx_custodies_fiscal_year_id ON public.custodies(fiscal_year_id);
CREATE INDEX idx_custodies_employee_id ON public.custodies(employee_id);
CREATE INDEX idx_custodies_status ON public.custodies(status);
CREATE INDEX idx_custody_transactions_custody_id ON public.custody_transactions(custody_id);
CREATE INDEX idx_custody_transactions_company_id ON public.custody_transactions(company_id);

-- Add updated_at trigger
CREATE TRIGGER update_custodies_updated_at
BEFORE UPDATE ON public.custodies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custody_transactions_updated_at
BEFORE UPDATE ON public.custody_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();