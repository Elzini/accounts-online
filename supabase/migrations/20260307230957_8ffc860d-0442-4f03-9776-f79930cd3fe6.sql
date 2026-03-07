-- Fix search_path security warning
ALTER FUNCTION public.sync_journal_line_to_tenant() SET search_path = public;