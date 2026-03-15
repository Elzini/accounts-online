-- Change bank_statements FK from CASCADE to RESTRICT
ALTER TABLE public.bank_statements DROP CONSTRAINT bank_statements_bank_account_id_fkey;
ALTER TABLE public.bank_statements ADD CONSTRAINT bank_statements_bank_account_id_fkey
  FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT;

-- Change bank_transactions FK on bank_account_id from CASCADE to RESTRICT
ALTER TABLE public.bank_transactions DROP CONSTRAINT bank_transactions_bank_account_id_fkey;
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_bank_account_id_fkey
  FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT;

-- Change bank_transactions FK on statement_id from CASCADE to RESTRICT
ALTER TABLE public.bank_transactions DROP CONSTRAINT bank_transactions_statement_id_fkey;
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_statement_id_fkey
  FOREIGN KEY (statement_id) REFERENCES public.bank_statements(id) ON DELETE CASCADE;

-- Change bank_reconciliations FK from CASCADE to RESTRICT
ALTER TABLE public.bank_reconciliations DROP CONSTRAINT bank_reconciliations_bank_account_id_fkey;
ALTER TABLE public.bank_reconciliations ADD CONSTRAINT bank_reconciliations_bank_account_id_fkey
  FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT;