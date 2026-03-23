-- Phase 3: Consolidate duplicate tables & fix columns

-- 1. Drop security_audit_trail (zero code references, overlaps with audit_logs)
DROP TABLE IF EXISTS public.security_audit_trail;

-- 2. Drop tenant_backups (zero code references, overlaps with backups table)
DROP TABLE IF EXISTS public.tenant_backups;

-- 3. Fix checks.currency: make NOT NULL with default 'SAR'
UPDATE public.checks SET currency = 'SAR' WHERE currency IS NULL;
ALTER TABLE public.checks ALTER COLUMN currency SET DEFAULT 'SAR';
ALTER TABLE public.checks ALTER COLUMN currency SET NOT NULL;