-- Add VAT invoice tracking field to expenses table
ALTER TABLE public.expenses 
ADD COLUMN has_vat_invoice boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.has_vat_invoice IS 'Indicates if the expense has a valid VAT invoice for input tax recovery';