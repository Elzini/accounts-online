
-- Drop duplicate trigger that copies wrong settings
DROP TRIGGER IF EXISTS trigger_company_created ON public.companies;

-- Also drop the sync_invoice_settings_trigger on companies (it syncs TO defaults, causing leaks)
DROP TRIGGER IF EXISTS sync_invoice_settings_trigger ON public.companies;
