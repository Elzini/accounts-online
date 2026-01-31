-- Add 'payroll' to the allowed reference_type values for journal_entries
ALTER TABLE public.journal_entries 
DROP CONSTRAINT IF EXISTS journal_entries_reference_type_check;

ALTER TABLE public.journal_entries 
ADD CONSTRAINT journal_entries_reference_type_check 
CHECK (reference_type = ANY (ARRAY[
  'sale'::text, 
  'purchase'::text, 
  'manual'::text, 
  'adjustment'::text, 
  'opening'::text, 
  'expense'::text, 
  'voucher'::text, 
  'financing'::text, 
  'bank_reconciliation'::text,
  'payroll'::text
]));