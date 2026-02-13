
ALTER TABLE journal_entries DROP CONSTRAINT journal_entries_reference_type_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_reference_type_check 
  CHECK (reference_type = ANY (ARRAY['sale','purchase','manual','adjustment','opening','expense','voucher','financing','bank_reconciliation','payroll','prepaid_expense','custody','custody_transaction']));
