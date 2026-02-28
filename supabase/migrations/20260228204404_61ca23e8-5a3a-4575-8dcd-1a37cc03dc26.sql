
-- Add gratuity column to payroll_items
ALTER TABLE public.payroll_items ADD COLUMN gratuity numeric NOT NULL DEFAULT 0;

-- Add total_gratuities column to payroll_records
ALTER TABLE public.payroll_records ADD COLUMN total_gratuities numeric NOT NULL DEFAULT 0;
