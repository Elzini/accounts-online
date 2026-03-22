-- تعديل دالة الحماية للسماح بحذف قيود الافتتاح (لإعادة التوليد)
CREATE OR REPLACE FUNCTION public.protect_posted_journal_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF COALESCE(OLD.is_posted, false) THEN
      -- السماح بحذف قيود الافتتاح والإقفال (لإعادة التوليد عند تحديث الأرصدة)
      IF OLD.reference_type IN ('opening', 'closing') THEN
        RETURN OLD;
      END IF;
      RAISE EXCEPTION 'Cannot delete posted journal entry %. Use reversal entry instead.', COALESCE(OLD.entry_number::text, OLD.id::text);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$