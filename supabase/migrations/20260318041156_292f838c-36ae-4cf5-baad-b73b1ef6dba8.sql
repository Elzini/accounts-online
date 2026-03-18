-- Allow editing/deleting lines of posted journal entries for correction flexibility
-- Protection remains on DELETE of the journal entry itself (header)
CREATE OR REPLACE FUNCTION public.protect_posted_journal_lines()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow all operations on journal lines (UPDATE, DELETE, INSERT)
  -- The parent journal entry header deletion is still protected separately
  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;