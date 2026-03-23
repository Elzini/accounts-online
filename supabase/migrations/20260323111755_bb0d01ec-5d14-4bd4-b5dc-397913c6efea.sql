-- audit_hash_chain: 10,436 seq scans, 0 idx scans
CREATE INDEX IF NOT EXISTS idx_audit_hash_chain_audit_log_id ON public.audit_hash_chain(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_audit_hash_chain_sequence ON public.audit_hash_chain(sequence_number DESC);

-- security_audit_trail: optimize tenant lookups
CREATE INDEX IF NOT EXISTS idx_security_audit_trail_tenant ON public.security_audit_trail(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_trail_created ON public.security_audit_trail(created_at DESC);

-- journal_entry_lines: optimize for trial balance (account + company with amounts)
CREATE INDEX IF NOT EXISTS idx_jel_account_amounts ON public.journal_entry_lines(account_id, company_id) INCLUDE (debit, credit);

-- invoices: optimize for supplier lookup
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON public.invoices(supplier_id) WHERE supplier_id IS NOT NULL;

-- default_company_settings: high seq scans - index on setting_type
CREATE INDEX IF NOT EXISTS idx_default_company_settings_type ON public.default_company_settings(setting_type);

-- integrity_hashes: optimize record lookups
CREATE INDEX IF NOT EXISTS idx_integrity_hashes_record ON public.integrity_hashes(table_name, record_id);