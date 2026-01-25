-- Add journal_entry_id column to vouchers table to link vouchers with journal entries
ALTER TABLE public.vouchers 
ADD COLUMN IF NOT EXISTS journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vouchers_journal_entry_id ON public.vouchers(journal_entry_id);