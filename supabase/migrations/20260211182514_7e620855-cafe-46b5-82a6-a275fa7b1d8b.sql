
-- Add journal_entry_id to custodies for linking creation journal entry
ALTER TABLE public.custodies ADD COLUMN IF NOT EXISTS journal_entry_id uuid REFERENCES public.journal_entries(id);

-- Add journal_entry_id to custody_transactions for linking transaction journal entries
ALTER TABLE public.custody_transactions ADD COLUMN IF NOT EXISTS journal_entry_id uuid REFERENCES public.journal_entries(id);

-- Add custody_account_id to custodies (the account where custody fund is held, e.g., عهد الموظفين)
ALTER TABLE public.custodies ADD COLUMN IF NOT EXISTS custody_account_id uuid REFERENCES public.account_categories(id);

-- Add cash_account_id to custodies (where the money came from, e.g., الصندوق)
ALTER TABLE public.custodies ADD COLUMN IF NOT EXISTS cash_account_id uuid REFERENCES public.account_categories(id);
