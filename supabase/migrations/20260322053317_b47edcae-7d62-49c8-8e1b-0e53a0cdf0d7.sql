-- إصلاح دالة إعادة الترقيم لتجنب تعارض ALTER TABLE
CREATE OR REPLACE FUNCTION public.renumber_journal_entries_after_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- إعادة ترقيم القيود بدون تعطيل triggers
  -- trigger الحماية يسمح بالتحديثات بالفعل (UPDATE → RETURN NEW)
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (
      ORDER BY entry_date ASC, created_at ASC
    ) AS new_number
    FROM public.journal_entries
    WHERE company_id = OLD.company_id
      AND fiscal_year_id IS NOT DISTINCT FROM OLD.fiscal_year_id
  )
  UPDATE public.journal_entries je
  SET entry_number = numbered.new_number
  FROM numbered
  WHERE je.id = numbered.id
    AND je.entry_number != numbered.new_number;
  
  RETURN OLD;
END;
$function$