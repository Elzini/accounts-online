CREATE OR REPLACE FUNCTION public.protect_posted_journal_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Allow updates to posted journal entries for correction flexibility
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF COALESCE(OLD.is_posted, false) THEN
      RAISE EXCEPTION 'Cannot delete posted journal entry %. Use reversal entry instead.', COALESCE(OLD.entry_number::text, OLD.id::text);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;