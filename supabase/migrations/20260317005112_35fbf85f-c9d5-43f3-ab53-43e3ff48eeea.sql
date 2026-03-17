-- Fix journal protection triggers to use is_posted (journal_entries has no status column)

CREATE OR REPLACE FUNCTION public.protect_posted_journal_entries()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Allow internal nested trigger updates (e.g., totals sync from journal lines trigger)
    IF COALESCE(OLD.is_posted, false) AND pg_trigger_depth() = 1 THEN
      RAISE EXCEPTION 'Cannot modify posted journal entry %. Use reversal entry instead.', COALESCE(OLD.entry_number::text, OLD.id::text);
    END IF;
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
$$;

CREATE OR REPLACE FUNCTION public.protect_posted_journal_lines()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  entry_is_posted boolean;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT is_posted INTO entry_is_posted
    FROM public.journal_entries
    WHERE id = OLD.journal_entry_id;

    IF COALESCE(entry_is_posted, false) THEN
      RAISE EXCEPTION 'Cannot modify lines of posted journal entry. Use reversal entry instead.';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;