-- إضافة prepaid_expense للقيم المسموحة في reference_type
ALTER TABLE public.journal_entries DROP CONSTRAINT journal_entries_reference_type_check;

ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_reference_type_check 
CHECK (reference_type = ANY (ARRAY['sale'::text, 'purchase'::text, 'manual'::text, 'adjustment'::text, 'opening'::text, 'expense'::text, 'voucher'::text, 'financing'::text, 'bank_reconciliation'::text, 'payroll'::text, 'prepaid_expense'::text]));