CREATE TABLE public.custody_amount_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custody_id UUID NOT NULL REFERENCES public.custodies(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  old_amount NUMERIC NOT NULL,
  new_amount NUMERIC NOT NULL,
  change_amount NUMERIC GENERATED ALWAYS AS (new_amount - old_amount) STORED,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.custody_amount_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View custody changes" ON public.custody_amount_changes
FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Insert custody changes" ON public.custody_amount_changes
FOR INSERT WITH CHECK (is_super_admin(auth.uid()) OR company_id = get_user_company_id(auth.uid()));

CREATE POLICY "strict_isolation" ON public.custody_amount_changes
FOR ALL USING (strict_company_check(company_id));

CREATE OR REPLACE FUNCTION public.track_custody_amount_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.custody_amount IS DISTINCT FROM NEW.custody_amount THEN
    INSERT INTO public.custody_amount_changes (custody_id, company_id, old_amount, new_amount, changed_by)
    VALUES (NEW.id, NEW.company_id, OLD.custody_amount, NEW.custody_amount, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER custody_amount_change_tracker
BEFORE UPDATE ON public.custodies
FOR EACH ROW
EXECUTE FUNCTION public.track_custody_amount_change();

INSERT INTO public.custody_amount_changes (custody_id, company_id, old_amount, new_amount, notes)
VALUES (
  '5671fb2c-70c6-49c5-bea6-66cd2cfac952',
  (SELECT company_id FROM custodies WHERE id = '5671fb2c-70c6-49c5-bea6-66cd2cfac952'),
  3050, 44550,
  'سجل تاريخي - المبلغ الأصلي عند الإنشاء كان 3,050 ر.س وتم رفعه تدريجياً إلى 44,550 ر.س'
);