
-- Add employee_id to custody_transactions for advance-type expenses
ALTER TABLE public.custody_transactions 
ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;
