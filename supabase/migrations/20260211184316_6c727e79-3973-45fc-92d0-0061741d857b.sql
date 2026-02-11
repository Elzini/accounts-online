
-- Add custody_type to custodies table
ALTER TABLE public.custodies ADD COLUMN IF NOT EXISTS custody_type text NOT NULL DEFAULT 'custody';

-- Add advance_id to link custody to employee_advances
ALTER TABLE public.custodies ADD COLUMN IF NOT EXISTS advance_id uuid REFERENCES public.employee_advances(id) ON DELETE SET NULL;

-- Add installment columns for advances
ALTER TABLE public.custodies ADD COLUMN IF NOT EXISTS installment_amount numeric DEFAULT 0;
ALTER TABLE public.custodies ADD COLUMN IF NOT EXISTS installment_count integer DEFAULT 1;
