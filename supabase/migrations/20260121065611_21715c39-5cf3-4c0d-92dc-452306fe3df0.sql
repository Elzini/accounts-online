-- Drop the old constraint and add a new one with 'expense' and 'voucher' types
ALTER TABLE public.journal_entries 
DROP CONSTRAINT journal_entries_reference_type_check;

ALTER TABLE public.journal_entries 
ADD CONSTRAINT journal_entries_reference_type_check 
CHECK (reference_type = ANY (ARRAY['sale'::text, 'purchase'::text, 'manual'::text, 'adjustment'::text, 'opening'::text, 'expense'::text, 'voucher'::text]));