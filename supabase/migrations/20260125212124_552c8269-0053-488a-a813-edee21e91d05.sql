
-- Add account_id column to expenses table to link with chart of accounts
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.account_categories(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON public.expenses(account_id);
