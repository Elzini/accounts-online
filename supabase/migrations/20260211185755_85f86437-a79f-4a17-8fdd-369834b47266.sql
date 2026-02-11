
-- Add installment tracking to employee_advances
ALTER TABLE public.employee_advances ADD COLUMN IF NOT EXISTS monthly_deduction numeric DEFAULT 0;
ALTER TABLE public.employee_advances ADD COLUMN IF NOT EXISTS remaining_amount numeric DEFAULT 0;
ALTER TABLE public.employee_advances ADD COLUMN IF NOT EXISTS total_installments integer DEFAULT 1;
ALTER TABLE public.employee_advances ADD COLUMN IF NOT EXISTS deducted_installments integer DEFAULT 0;
ALTER TABLE public.employee_advances ADD COLUMN IF NOT EXISTS custody_id uuid REFERENCES public.custodies(id) ON DELETE SET NULL;

-- Update existing advances: set remaining_amount = amount where not deducted
UPDATE public.employee_advances SET remaining_amount = amount WHERE is_deducted = false AND remaining_amount = 0;
