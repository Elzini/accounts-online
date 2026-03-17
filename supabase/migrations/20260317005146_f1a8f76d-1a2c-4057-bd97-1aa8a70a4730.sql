-- Security hardening for existing function (no logic change)
ALTER FUNCTION public.create_invoice_journal_entry() SET search_path = public;