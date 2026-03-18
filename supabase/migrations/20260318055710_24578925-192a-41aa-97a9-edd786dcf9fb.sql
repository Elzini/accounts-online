CREATE OR REPLACE FUNCTION public.delete_orphan_journal_entry(entry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete journal entry lines first
  DELETE FROM public.journal_entry_lines WHERE journal_entry_id = entry_id;
  
  -- Temporarily disable protection triggers
  ALTER TABLE public.journal_entries DISABLE TRIGGER USER;
  
  -- Delete the journal entry
  DELETE FROM public.journal_entries WHERE id = entry_id;
  
  -- Re-enable triggers
  ALTER TABLE public.journal_entries ENABLE TRIGGER USER;
END;
$$;